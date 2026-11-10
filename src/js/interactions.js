export function initInteractions(sliders, overlays) {
  function bindPreview(linkSelector, imageSelector, linkClass, imageClass) {
    const links = [...document.querySelectorAll(linkSelector)];
    const images = [...document.querySelectorAll(imageSelector)];
    links.forEach((link, index) => {
      const preview = () => {
        links.forEach((item, i) => item.classList.toggle(linkClass, i === index));
        images.forEach((item, i) => item.classList.toggle(imageClass, i === index));
      };
      link.addEventListener('mouseenter', preview);
      link.addEventListener('focus', preview);
    });
    return links;
  }

  bindPreview('.menu__link', '.menu__image-item', 'menu__link--active', 'menu__image-item--active');
  const rangeLinks = bindPreview('.range__link', '.range-images__item', 'range__link--active', 'range-images__item--active');
  rangeLinks.forEach((link, index) => {
    link.addEventListener('click', () => {
      overlays.open(document.querySelector('.popup-slider'), link);
      sliders.showSlide(sliders.range, index);
    });
  });

  const galleryPanels = [...document.querySelectorAll('.popup-delivery')];
  document.querySelectorAll('.carousel-box').forEach((box, galleryIndex) => {
    const panel = galleryPanels[galleryIndex];
    if (!panel) return;
    box.querySelectorAll('.carousel-box__link').forEach((link, index) => {
      link.addEventListener('click', () => {
        overlays.open(panel, link);
        sliders.showSlide(sliders.gallery(panel), index);
      });
    });
  });

  document.querySelectorAll('.news-page__play-btn').forEach((button) => {
    const video = button.parentElement.querySelector('video');
    if (!video) return;
    button.addEventListener('click', async () => {
      video.controls = true;
      button.classList.add('news-page__play-btn--hidden');
      try { await video.play(); }
      catch { button.classList.remove('news-page__play-btn--hidden'); }
    });
    video.addEventListener('ended', () => button.classList.remove('news-page__play-btn--hidden'));
  });

}
