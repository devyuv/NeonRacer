import * as THREE from 'three';
import { buildCarMesh } from '../cars/CarModel.js';

export class GarageView {
  constructor(root) {
    this.root = root;
    this.wrap = root.querySelector('#garage-canvas-wrap');
    this.nameEl = root.querySelector('#garage-car-name');
    this.statEls = {
      speed: root.querySelector('[data-stat="speed"]'),
      accel: root.querySelector('[data-stat="accel"]'),
      handling: root.querySelector('[data-stat="handling"]'),
      nitro: root.querySelector('[data-stat="nitro"]')
    };

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(4.2, 2.3, 4.2);
    this.camera.lookAt(0, 0.4, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.wrap.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0x8899ff, 0.7);
    this.scene.add(ambient);
    const key = new THREE.DirectionalLight(0x00e6ff, 1.1);
    key.position.set(3, 5, 2);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xff00c8, 0.6);
    rim.position.set(-3, 2, -3);
    this.scene.add(rim);

    this.currentCarGroup = null;
    this._raf = null;
    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(this.wrap);
    this._resize();
  }

  _resize() {
    const w = this.wrap.clientWidth || 300;
    const h = this.wrap.clientHeight || 220;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  showCar(carDef) {
    if (this.currentCarGroup) {
      this.scene.remove(this.currentCarGroup);
    }
    const built = buildCarMesh(carDef, { withLights: false });
    this.currentCarGroup = built.group;
    this.scene.add(this.currentCarGroup);

    this.nameEl.textContent = carDef.name;
    this.statEls.speed.style.width = Math.round(carDef.stats.speed * 100) + '%';
    this.statEls.accel.style.width = Math.round(carDef.stats.accel * 100) + '%';
    this.statEls.handling.style.width = Math.round(carDef.stats.handling * 100) + '%';
    this.statEls.nitro.style.width = Math.round(carDef.stats.nitro * 100) + '%';
  }

  start() {
    const animate = () => {
      this._raf = requestAnimationFrame(animate);
      if (this.currentCarGroup) this.currentCarGroup.rotation.y += 0.012;
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  }
}
