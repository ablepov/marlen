import Swiper from 'swiper';
import { A11y, Autoplay, Mousewheel, Navigation, Pagination } from 'swiper/modules';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

Swiper.use([A11y, Autoplay, Mousewheel, Navigation, Pagination]);
Swiper.extendDefaults({ navigation: { addIcons: false } });
gsap.registerPlugin(ScrollTrigger);

export { Swiper, gsap, ScrollTrigger };
export { default as SplitType } from 'split-type';
export { SmoothScroll } from '../../shared/js/smooth-scroll.js';
