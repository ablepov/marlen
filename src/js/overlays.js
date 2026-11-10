import scrollLock from 'scroll-lock';

export function initOverlays() {
  const header = document.querySelector('.header');
  const burger = document.querySelector('.burger');
  const closeButton = document.querySelector('.header-buttons__btn--close');
  const definitions = [
    ['.menu', 'menu--active', 'menu'],
    ['.popup', 'popup--active', 'popup'],
    ['.popup-slider', 'popup-slider--open', 'popup'],
    ['.popup-delivery', 'popup-delivery--open', 'gallery'],
  ];
  const panels = new Map();
  definitions.forEach(([selector, activeClass, kind]) => document.querySelectorAll(selector).forEach((element) => {
    element.setAttribute('aria-hidden', 'true');
    element.inert = true;
    panels.set(element, { activeClass, kind });
  }));
  let current = null;
  let opener = null;
  let entrance;

  function close(restoreFocus = true) {
    if (!current) return;
    entrance?.cancel();
    current.classList.remove(panels.get(current).activeClass);
    current.setAttribute('aria-hidden', 'true');
    current.inert = true;
    scrollLock.enablePageScroll(current);
    current = null;
    header?.classList.remove('open-menu', 'open-popup');
    burger?.classList.remove('burger--active');
    burger?.setAttribute('aria-expanded', 'false');
    closeButton?.classList.remove('header-buttons__btn--active');
    document.querySelector('.hero-page__btn')?.classList.remove('hero-page__btn--active');
    if (restoreFocus) opener?.focus({ preventScroll: true });
  }

  function open(element, trigger) {
    if (!element || !panels.has(element)) return;
    close(false);
    current = element;
    opener = trigger || document.activeElement;
    const { activeClass, kind } = panels.get(element);
    element.inert = false;
    element.setAttribute('aria-hidden', 'false');
    element.classList.add(activeClass);
    if (kind !== 'gallery') {
      header?.classList.add(kind === 'menu' ? 'open-menu' : 'open-popup');
    }
    burger?.classList.toggle('burger--active', kind === 'menu');
    burger?.setAttribute('aria-expanded', String(kind === 'menu'));
    closeButton?.classList.toggle('header-buttons__btn--active', kind === 'popup');
    scrollLock.disablePageScroll(element);
    if (kind !== 'menu' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      entrance = element.animate([{ transform: 'translateY(-12px)' }, { transform: 'translateY(0)' }],
        { duration: 180, easing: 'ease-out' });
    }
    const first = kind === 'menu' ? element.querySelector('a') :
      element.querySelector('.popup-delivery__close, .popup-slider__close, input, button');
    (first || closeButton)?.focus({ preventScroll: true });
  }

  burger?.setAttribute('aria-expanded', 'false');
  burger?.addEventListener('click', () => {
    const menu = document.querySelector('.menu');
    if (current === menu) close();
    else open(menu, burger);
  });
  closeButton?.addEventListener('click', () => close());
  document.querySelector('.hero-page__btn')?.addEventListener('click', (event) => {
    const popup = document.querySelector('.popup');
    open(popup, event.currentTarget);
    if (popup) event.currentTarget.classList.add('hero-page__btn--active');
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('.popup-delivery__close, .popup-slider__close')) close();
    if (event.target === current && panels.get(current)?.kind === 'gallery') close();
  });
  document.addEventListener('keydown', (event) => {
    if (!current) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key !== 'Tab') return;
    const controls = [...current.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]')]
      .filter((element) => element.getClientRects().length && !element.closest('[inert]'));
    if (panels.get(current).kind !== 'gallery') controls.push(panels.get(current).kind === 'menu' ? burger : closeButton);
    const visible = controls.filter(Boolean);
    if (!visible.length) return;
    event.preventDefault();
    const index = visible.indexOf(document.activeElement);
    const next = (index + (event.shiftKey ? -1 : 1) + visible.length) % visible.length;
    visible[next].focus();
  });
  return { open, close };
}
