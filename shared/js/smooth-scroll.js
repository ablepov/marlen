// Keep native scroll position and scrollbar, easing the fixed viewport's contents.
export class SmoothScroll {
  constructor({ target, scrollEase = 0.1, maxOffset = 500 }) {
    this.target = target;
    this.ease = scrollEase;
    this.maxOffset = maxOffset;
    this.position = window.scrollY;
    this.previousHeight = document.body.style.height;
    this.items = Array.from(target.querySelectorAll('[data-depth]'), element => ({
      element, depth: Number(element.dataset.depth) / 10, offset: 0, top: 0,
    }));
    this.tick = this.tick.bind(this);
    this.schedule = this.schedule.bind(this);
    this.update = this.update.bind(this);
    this.observer = new ResizeObserver(this.update);
    this.observer.observe(target);
    window.addEventListener('resize', this.update);
    window.addEventListener('scroll', this.schedule, { passive: true });
    this.update();
  }

  update() {
    document.body.style.height = this.target.offsetHeight + 'px';
    const top = this.target.getBoundingClientRect().top;
    for (const item of this.items) {
      item.top = item.element.getBoundingClientRect().top - top + item.offset;
    }
    this.schedule();
  }

  schedule() {
    if (this.frame) return;
    this.lastTime = performance.now() - 1000 / 60;
    this.frame = requestAnimationFrame(this.tick);
  }

  tick(time) {
    const frames = Math.min(100, Math.max(0, time - this.lastTime)) * 0.06;
    const step = 1 - Math.pow(1 - this.ease, frames);
    this.lastTime = time;
    const scroll = window.scrollY;
    this.position += (scroll - this.position) * step;
    if (Math.abs(scroll - this.position) < 0.05) this.position = scroll;
    this.target.style.transform = `translate3d(0, ${-this.position}px, 0)`;
    const height = window.innerHeight || 1;
    let moving = scroll !== this.position;
    for (const item of this.items) {
      const distance = (this.position + height / 2 - item.top) / (2 * height);
      const offset = Math.round(this.maxOffset * item.depth * distance);
      item.offset += (offset - item.offset) * step;
      if (Math.abs(item.offset - offset) < 0.05) item.offset = offset;
      item.element.style.transform = `translate3d(0, ${-item.offset}px, 0)`;
      moving ||= item.offset !== offset;
    }
    this.frame = moving ? requestAnimationFrame(this.tick) : 0;
  }

  destroy() {
    this.observer.disconnect();
    window.removeEventListener('resize', this.update);
    window.removeEventListener('scroll', this.schedule);
    cancelAnimationFrame(this.frame);
    document.body.style.height = this.previousHeight;
    this.target.style.removeProperty('transform');
    for (const { element } of this.items) element.style.removeProperty('transform');
  }
}
