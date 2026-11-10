const fs = require('node:fs/promises');
const path = require('node:path');

async function loadData(assets) {
  async function records(name) {
    const file = await fs.readFile(path.join(assets, 'files', name), 'utf8');
    return JSON.parse(file).results;
  }

  const branches = await records('location.json');
  const news = new Map();
  for (const item of await records('news.json')) {
    if (news.has(item.url)) continue;
    const image = item.image ? new URL(item.image).pathname.slice(1) : '';
    const imageExists = image.startsWith('images/') && await fs.stat(path.join(assets, image)).then(file => file.isFile(), () => false);
    news.set(item.url, {
      ...item,
      image: imageExists ? image : '',
      article: new URL(item.url).pathname === '/news/tradicionnye-magaziny-perezivut-onlain-revolyuciyu' ? 'news-page.html' : ''
    });
  }
  return { branches, news: [...news.values()] };
}

module.exports = require('./build/site')(__dirname, 3102, loadData);
