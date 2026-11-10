import { Swiper } from './vendor.js';

export function initSliders() {
  const rangeElement = document.querySelector('.popup-slider');
  const range = rangeElement ? new Swiper(rangeElement, {
    loop: true,
    mousewheel: { sensitivity: 1 },
    navigation: { prevEl: '.popup-slider__btn--prev', nextEl: '.popup-slider__btn--next' },
    on: { slideChange: () => { rangeElement.scrollTop = 0; } },
  }) : null;

  document.querySelectorAll('.carousel-box').forEach((box) => {
    new Swiper(box.querySelector('.carousel-box__slider'), {
      slidesPerView: 1.5,
      spaceBetween: 15,
      mousewheel: { sensitivity: 1 },
      navigation: {
        prevEl: box.querySelector('.carousel-box__btn--prev'),
        nextEl: box.querySelector('.carousel-box__btn--next'),
        disabledClass: 'carousel-box__btn--disabled',
      },
      breakpoints: { 768: { slidesPerView: 2, spaceBetween: 21 } },
    });
  });

  const awards = document.querySelector('.awards__slider');
  if (awards) new Swiper(awards, {
    slidesPerView: 1,
    spaceBetween: 25,
    watchOverflow: true,
    loop: false,
    rewind: true,
    slideActiveClass: 'awards__item--active',
    navigation: {
      prevEl: '.awards__btn--prev', nextEl: '.awards__btn--next', disabledClass: 'awards__btn--disabled',
    },
    breakpoints: {
      576: { slidesPerView: 3 },
      768: { slidesPerView: 4 },
      1200: { slidesPerView: 4, spaceBetween: 83 },
    },
  });

  const heroElement = document.querySelector('.hero-carousel');
  const desktop = window.matchMedia('(min-width: 768px)');
  let hero;
  function updateHero() {
    if (!heroElement) return;
    if (!desktop.matches) {
      hero?.destroy(true, true);
      hero = null;
    } else if (!hero) hero = new Swiper(heroElement, {
      loop: true,
      autoplay: { delay: 7000 },
      speed: 700,
      navigation: { nextEl: '.hero-carousel__arrow--next' },
      pagination: {
        el: '.hero-carousel__pagination', type: 'bullets', clickable: true,
        bulletElement: 'button', bulletClass: 'hero-carousel__bullet', bulletActiveClass: 'hero-carousel__bullet--active',
      },
    });
  }
  updateHero();
  desktop.addEventListener('change', updateHero);

  const galleries = new WeakMap();
  function gallery(panel) {
    if (!galleries.has(panel)) galleries.set(panel, new Swiper(panel.querySelector('.popup-delivery__box'), {
      loop: true,
      spaceBetween: 15,
      mousewheel: { sensitivity: 1 },
      navigation: {
        prevEl: panel.querySelector('.popup-delivery__btn--prev'),
        nextEl: panel.querySelector('.popup-delivery__btn--next'),
      },
    }));
    return galleries.get(panel);
  }

  function showSlide(slider, index) {
    if (!slider) return;
    slider.update();
    slider.slideToLoop(index, 0, false);
  }
  return { range, gallery, showSlide };
}
