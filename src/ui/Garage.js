import { drawCar } from '../cars/CarModel.js';

export class GarageView {
  constructor(root) {
    this.wrap = root.querySelector('#garage-canvas-wrap');
    this.nameEl = root.querySelector('#garage-car-name');
    this.statEls = {
      speed: root.querySelector('[data-stat="speed"]'),
      accel: root.querySelector('[data-stat="accel"]'),
      handling: root.querySelector('[data-stat="handling"]'),
      nitro: root.querySelector('[data-stat="nitro"]')
    };

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.wrap.appendChild(this.canvas);

    this.currentCar = null;
    this._raf = null;
    this._angle = 0;
    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(this.wrap);
    this._resize();
  }

  _resize() {
    const w = this.wrap.clientWidth || 300;
    const h = this.wrap.clientHeight || 220;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w;
    this.h = h;
  }

  showCar(carDef) {
    this.currentCar = carDef;
    this.nameEl.textContent = carDef.name;
    this.statEls.speed.style.width = Math.round(carDef.stats.speed * 100) + '%';
    this.statEls.accel.style.width = Math.round(carDef.stats.accel * 100) + '%';
    this.statEls.handling.style.width = Math.round(carDef.stats.handling * 100) + '%';
    this.statEls.nitro.style.width = Math.round(carDef.stats.nitro * 100) + '%';
  }

  start() {
    const animate = () => {
      this._raf = requestAnimationFrame(animate);
      this._angle += 0.012;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      if (this.currentCar) {
        ctx.save();
        ctx.translate(this.w / 2, this.h / 2);
        ctx.scale(2.4, 2.4);
        ctx.rotate(Math.sin(this._angle) * 0.5);
        drawCar(ctx, this.currentCar, { nitroActive: false, braking: false, driftAmount: 0 });
        ctx.restore();
      }
    };
    animate();
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  }
}
