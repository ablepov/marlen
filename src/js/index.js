import { initOverlays } from './overlays.js';

const overlays = initOverlays();
import('./page.js').then(({ initPage }) => initPage(overlays));
