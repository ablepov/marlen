import { gsap, ScrollTrigger, SmoothScroll, SplitType } from './vendor.js';

export function initMotion() {
  const wrapper = document.querySelector('.wrapper');
  const viewport = document.querySelector('.viewport');
  const header = document.querySelector('.header');
  const topButton = document.querySelector('.btn-to-top');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent);
  let smooth;
  if (wrapper && !mobile && !reduced) {
    smooth = new SmoothScroll({ target: wrapper, scrollEase: 0.1, maxOffset: 500 });
    document.body.classList.add('smooth-off');
    viewport?.classList.add('smooth-off');
  }
  function refresh() {
    smooth?.update();
    ScrollTrigger.refresh();
  }
  topButton?.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
  });

  let previousY = window.scrollY;
  let frame;
  function updateNavigation() {
    frame = null;
    const y = window.scrollY;
    const up = y < previousY;
    header?.classList.toggle('header--fixed', y > 0);
    if (topButton) gsap.to(topButton, { y: up && y > window.innerHeight ? 0 : 200, duration: reduced ? 0 : 0.35, overwrite: true });
    previousY = y;
  }
  if (topButton) gsap.set(topButton, { y: 200 });
  updateNavigation();
  window.addEventListener('pageshow', updateNavigation);
  window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(updateNavigation); }, { passive: true });

  if (reduced) return { refresh };
  const pageTargets = (selector) => [...document.querySelectorAll(selector)]
    .filter((element) => !element.closest('.popup, .popup-slider, .popup-delivery, .menu'));
  const entrance = gsap.timeline();
  const lines = pageTargets('.header__line, .title-page__line');
  if (lines.length) entrance.from(lines, { x: '-100%', duration: 0.7, clearProps: 'transform,opacity' });

  function reveal(selector, from, to = {}) {
    pageTargets(selector).forEach((element) => gsap.fromTo(element, from, {
      opacity: 1, x: 0, y: 0, ...to,
      scrollTrigger: { trigger: element, start: 'top bottom', end: 'top center', scrub: true },
    }));
  }
  reveal('.section-trigger', { opacity: 0, x: 400 });
  reveal('.title-trigger', { opacity: 0, x: -400 });
  reveal('.up-trigger', { opacity: 0, y: 300 });
  reveal('.about__image-box', { opacity: 0 });
  reveal('.about__title, .about__text', { opacity: 0, x: 200 });
  reveal('.about__link', { opacity: 0, y: 50 });
  if (mobile) reveal('.img-parallax', { yPercent: 20 }, { yPercent: -15 });

  pageTargets('.title-split').forEach((element) => {
    const split = new SplitType(element, { types: 'lines', lineClass: 'title-split__title', tagName: 'span' });
    split.lines.forEach((line, index) => gsap.fromTo(line,
      { xPercent: index % 2 ? 50 : -20, opacity: 0 },
      { xPercent: index % 2 ? -10 : 10, opacity: 1,
        scrollTrigger: { trigger: element, start: 'top bottom', end: 'bottom center', scrub: true } }));
  });
  pageTargets('.line-trigger').forEach((element) => gsap.fromTo(element, { xPercent: -150 }, {
    xPercent: 0, duration: 1, scrollTrigger: { trigger: element, start: 'top center' },
  }));
  pageTargets('.underline-trigger').forEach((element) => {
    const timeline = gsap.timeline({ scrollTrigger: { trigger: element, start: 'top center' } });
    timeline.fromTo(element, { backgroundSize: '0 3px' }, { backgroundSize: '100% 3px', duration: 1.5 })
      .to(element, { backgroundSize: '0% 3px', delay: 2, duration: 1.5 });
  });
  const noteLine = document.querySelector('.hero-carousel__note-line');
  if (noteLine) entrance.fromTo(noteLine, { x: '-120%' }, { x: 0, duration: 1.5 })
    .to(noteLine, { x: '120%', duration: 1.5 }, '+=2');
  const titleBackground = document.querySelector('.title__bg');
  if (titleBackground) entrance.fromTo(titleBackground, { x: '-120%' }, { x: 0, duration: 1.5 })
    .to('.title__element', { color: 'white', duration: 1.5 }, '-=1.5')
    .to('.title__element', { color: '#3D3B3C', delay: 2, duration: 1.5 })
    .to(titleBackground, { x: '120%', duration: 1.5 }, '-=1.5');

  // Lazy images, web fonts, and changing brand pages can change the scrollable height.
  window.addEventListener('load', refresh, { once: true });
  document.fonts?.ready.then(refresh);
  document.querySelectorAll('img[loading="lazy"]').forEach((image) => image.addEventListener('load', refresh, { once: true }));
  return { refresh };
}
