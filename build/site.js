const fs = require('node:fs/promises');
const { rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { series, watch } = require('gulp');
const browserSync = require('browser-sync');
const CleanCSS = require('clean-css');
const esbuild = require('esbuild');
const less = require('less');
const sharp = require('sharp');
const { factory: createTwig } = require('twig');

async function copyAssets(source, destination) {
  await fs.mkdir(destination, { recursive: true });
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    const input = path.join(source, entry.name);
    const output = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyAssets(input, output);
    } else if (/\.(png|jpe?g)$/i.test(entry.name)) {
      const original = await fs.readFile(input);
      const image = sharp(original);
      const metadata = await image.metadata();
      let bytes = original;
      if (metadata.format === 'png' && !metadata.pages && !metadata.orientation && !metadata.hasProfile && metadata.depth === 'uchar') {
        const png = await image.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
        if (png.length < original.length) bytes = png;
      } else if (metadata.format === 'jpeg' && original.length >= 80000 && !metadata.hasProfile) {
        const jpeg = await image.autoOrient().jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
        if (jpeg.length <= original.length * 0.8) bytes = jpeg;
      }
      await fs.writeFile(output, bytes);
    } else {
      await fs.copyFile(input, output);
    }
  }
}

function fingerprint(bytes) {
  return createHash('sha256').update(bytes).digest('hex').slice(0, 12);
}

module.exports = function siteTasks(directory, port, loadData = async () => ({})) {
  const source = path.join(directory, 'src');
  const assets = path.join(source, 'assets');
  const pages = path.join(source, 'templates', 'pages');
  const styleEntry = path.join(source, 'less', 'style.less');
  let previewDirectory;

  async function compileStyles(output, production) {
    const stylesheet = await fs.readFile(styleEntry, 'utf8');
    let { css } = await less.render(stylesheet, { filename: styleEntry, rewriteUrls: 'off' });
    if (production) {
      const result = new CleanCSS({ level: 1, rebase: false }).minify(css);
      if (result.errors.length) throw new Error(result.errors.join('\n'));
      css = result.styles;
    }
    const cssDir = path.join(output, 'css');
    await fs.mkdir(cssDir, { recursive: true });
    const cssFile = path.join(cssDir, 'style.min.css');
    const temporaryFile = cssFile + '.' + process.pid + '.tmp';
    await fs.writeFile(temporaryFile, css);
    await fs.rename(temporaryFile, cssFile);
    return production ? fingerprint(css) : 'dev';
  }

  async function render(output, production) {
    const [cssVersion, jsVersion] = await Promise.all([
      compileStyles(output, production), compileScripts(output, production),
    ]);
    const context = {
      cssVersion, jsVersion,
      ...await loadData(assets)
    };
    const names = (await fs.readdir(pages)).filter(name => name.endsWith('.twig'));
    // Reuse layouts and includes during one build, then discard the cache for live edits.
    const twig = createTwig();
    for (const name of names) {
      const template = twig.twig({ path: path.join(pages, name), async: false, rethrow: true, autoescape: true });
      const html = template.render({ ...context, page: path.basename(name, '.twig') });
      await fs.writeFile(path.join(output, name.replace(/\.twig$/, '.html')), html);
    }
    if (!production) {
      const current = new Set(names.map(name => name.replace(/\.twig$/, '.html')));
      for (const name of await fs.readdir(output)) {
        if (name.endsWith('.html') && !current.has(name)) await fs.unlink(path.join(output, name));
      }
    }
  }

  async function compileScripts(output, production) {
    const outfile = path.join(output, 'js', 'script.min.js');
    const result = await esbuild.build({
      absWorkingDir: directory,
      entryPoints: { 'script.min': 'src/js/index.js' },
      outdir: path.dirname(outfile),
      bundle: true,
      splitting: true,
      chunkNames: production ? '[name]-[hash]' : '[name]',
      format: 'esm',
      target: 'es2020',
      minify: production,
      sourcemap: production ? false : 'linked',
      legalComments: 'eof',
      banner: { js: '/*! Third-party notices: script.min.js.LICENSE.txt */' },
      write: false,
    });
    await fs.mkdir(path.dirname(outfile), { recursive: true });
    const entry = result.outputFiles.find(file => file.path === outfile);
    // Publish dependencies before the entry that imports them.
    for (const file of [...result.outputFiles.filter(file => file !== entry), entry]) {
      const temp = file.path + '.' + process.pid + '.tmp';
      await fs.writeFile(temp, file.contents);
      await fs.rename(temp, file.path);
    }
    return production ? fingerprint(entry.contents) : 'dev';
  }

  async function build() {
    const staging = await fs.mkdtemp(path.join(directory, '.build-'));
    const output = path.join(directory, 'dist');
    try {
      const next = path.join(staging, 'next');
      await copyAssets(assets, next);
      await render(next, true);
      const previous = path.join(staging, 'previous');
      try {
        await fs.rename(output, previous);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      try {
        await fs.rename(next, output);
      } catch (error) {
        await fs.rename(previous, output);
        throw error;
      }
    } finally {
      // Keep a previous build for recovery if Windows prevented its restoration.
      const previous = path.join(staging, 'previous');
      const hasOutput = await fs.stat(output).then(() => true, () => false);
      const hasPrevious = await fs.stat(previous).then(() => true, () => false);
      if (hasOutput || !hasPrevious) await fs.rm(staging, { recursive: true, force: true });
    }
  }

  async function preview() {
    previewDirectory = await fs.mkdtemp(path.join(tmpdir(), path.basename(directory) + '-preview-'));
    process.once('exit', () => rmSync(previewDirectory, { recursive: true, force: true }));
    await render(previewDirectory, false);
  }

  function serve(done) {
    const server = browserSync.create();
    server.init({ server: { baseDir: [previewDirectory, assets] }, port, listen: '127.0.0.1', open: false, ui: false, notify: false }, error => {
      if (error) return done(error);
      let stylesOnly = true;
      const watcher = watch(['src/**/*', 'styles/**/*.less', 'shared/js/**/*.js'], { cwd: directory }, async function refresh() {
        const refreshStyles = stylesOnly;
        stylesOnly = true;
        try {
          if (refreshStyles) {
            await compileStyles(previewDirectory, false);
            server.reload('style.min.css');
            return;
          }
          await render(previewDirectory, false);
          server.reload();
        } catch (error) {
          console.error(error);
        }
      });
      watcher.on('all', (_event, file) => {
        const absolute = path.resolve(directory, file);
        const input = path.relative(directory, absolute).split(path.sep).join('/');
        if (!input.startsWith('src/less/') && !input.startsWith('styles/')) stylesOnly = false;
      });
      done();
    });
  }

  return { build, dev: series(preview, serve) };
};
