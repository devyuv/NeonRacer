export class KeyboardControls {
  constructor() {
    this.keys = {};
    this._onDown = (e) => { this.keys[e.code] = true; };
    this._onUp = (e) => { this.keys[e.code] = false; };
    window.addEventListener('keydown', this._onDown);
    window.addEventListener('keyup', this._onUp);
  }

  getInput() {
    const up = this.keys['KeyW'] || this.keys['ArrowUp'];
    const down = this.keys['KeyS'] || this.keys['ArrowDown'];
    const left = this.keys['KeyA'] || this.keys['ArrowLeft'];
    const right = this.keys['KeyD'] || this.keys['ArrowRight'];
    const nitro = this.keys['Space'];

    let steer = 0;
    // In this top-down 2D view, increasing heading turns the car clockwise (right),
    // so RIGHT/D maps directly to +1 - no sign flip needed.
    if (left) steer -= 1;
    if (right) steer += 1;

    return {
      throttle: up ? 1 : 0,
      brake: !!down,
      steer,
      nitro: !!nitro
    };
  }

  dispose() {
    window.removeEventListener('keydown', this._onDown);
    window.removeEventListener('keyup', this._onUp);
  }
}
