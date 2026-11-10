import { initSliders } from './sliders.js';
import { initInteractions } from './interactions.js';
import { initMotion } from './motion.js';
import { initBrands } from './brands.js';

export function initPage(overlays) {
  const probe = new Image();
  probe.onload = probe.onerror = () => document.documentElement.classList.add(probe.height === 2 ? 'webp' : 'no-webp');
  probe.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';

  const sliders = initSliders();
  const motion = initMotion();
  initInteractions(sliders, overlays);
  initBrands(motion.refresh);
}

