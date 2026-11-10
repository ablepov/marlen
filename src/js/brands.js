export function initBrands(onChange) {
  const original = document.querySelector('.brands-slider');
  if (!original) return;
  const parent = original.parentElement;
  const items = [...original.children];
  let pages = [original];
  let active = 0;
  let lastWidth = 0;

  function rebuild() {
    const width = parent.clientWidth;
    if (!width || width === lastWidth) return;
    lastWidth = width;
    pages.slice(1).forEach((page) => page.remove());
    original.append(...items);
    original.classList.add('active');
    const firstTop = items[0]?.offsetTop;
    const columns = Math.max(1, items.filter((item) => item.offsetTop === firstTop).length);
    const rowHeight = items[0]?.offsetHeight || 150;
    const maxHeight = parseFloat(getComputedStyle(original).maxHeight) || rowHeight * 3;
    const perPage = columns * Math.max(1, Math.floor(maxHeight / rowHeight));
    pages = [original];
    for (let offset = perPage; offset < items.length; offset += perPage) {
      const page = original.cloneNode(false);
      page.classList.remove('active');
      page.append(...items.slice(offset, offset + perPage));
      parent.insertBefore(page, original.nextSibling);
      pages.push(page);
    }
    active = Math.min(active, pages.length - 1);
    pages.forEach((page, index) => page.classList.toggle('active', index === active));
    const hasPages = pages.length > 1;
    document.querySelectorAll('.brands__btn').forEach((button) => {
      button.disabled = !hasPages;
      button.setAttribute('aria-disabled', String(!hasPages));
    });
    onChange();
  }
  function change(direction) {
    active = (active + direction + pages.length) % pages.length;
    pages.forEach((page, index) => page.classList.toggle('active', index === active));
    onChange();
  }
  document.querySelector('.brands__btn--prev')?.addEventListener('click', () => change(-1));
  document.querySelector('.brands__btn--next')?.addEventListener('click', () => change(1));
  rebuild();
  let frame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(rebuild);
  });
}
