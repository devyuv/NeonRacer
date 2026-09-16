// Mobile touch layout: LEFT / RIGHT steer buttons, BRAKE, NITRO.
// Matches the requested mobile-first control scheme: the car auto-accelerates
// (as most mobile arcade racers do) unless the player is braking, so thumbs
// stay free for steering + nitro instead of needing a fifth accelerate button.
export class TouchControls {
  constructor(root, controlType = 'touch') {
    this.controlType = controlType;
    this.state = { left: false, right: false, brake: false, nitro: false };
    this.tilt = 0;

    this.btnLeft = root.querySelector('#btn-steer-left');
    this.btnRight = root.querySelector('#btn-steer-right');
    this.btnBrake = root.querySelector('#btn-brake');
    this.btnNitro = root.querySelector('#btn-nitro');

    this._bind(this.btnLeft, 'left');
    this._bind(this.btnRight, 'right');
    this._bind(this.btnBrake, 'brake');
    this._bind(this.btnNitro, 'nitro');

    this._onOrientation = (e) => {
      if (e.gamma === null) return;
      // gamma: left-right tilt in degrees (-90..90). Clamp + normalize to -1..1,
      // then negate so tilting the phone right actually steers right on screen
      // (matches the sign convention used by the L/R buttons below).
      const clamped = Math.max(-30, Math.min(30, e.gamma));
      this.tilt = -(clamped / 30);
    };
  }

  _bind(el, key) {
    if (!el) return;
    const press = (e) => { e.preventDefault(); this.state[key] = true; el.classList.add('pressed'); };
    const release = (e) => { if (e) e.preventDefault(); this.state[key] = false; el.classList.remove('pressed'); };
    el.addEventListener('touchstart', press, { passive: false });
    el.addEventListener('touchend', release, { passive: false });
    el.addEventListener('touchcancel', release, { passive: false });
    el.addEventListener('pointerdown', press);
    el.addEventListener('pointerup', release);
    el.addEventListener('pointerleave', release);
  }

  setControlType(type) {
    this.controlType = type;
    if (type === 'tilt') {
      this.enableTilt();
    } else {
      this.disableTilt();
    }
  }

  async enableTilt() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res !== 'granted') return;
      } catch (e) { return; }
    }
    window.addEventListener('deviceorientation', this._onOrientation);
  }

  disableTilt() {
    window.removeEventListener('deviceorientation', this._onOrientation);
    this.tilt = 0;
  }

  getInput() {
    let steer = 0;
    if (this.controlType === 'tilt') {
      steer = this.tilt;
    } else {
      // Positive steer turns the car right on screen - see KeyboardControls.js for the
      // same convention.
      if (this.state.left) steer += 1;
      if (this.state.right) steer -= 1;
    }
    return {
      throttle: this.state.brake ? 0 : 1,
      brake: this.state.brake,
      steer,
      nitro: this.state.nitro
    };
  }

  dispose() {
    this.disableTilt();
  }
}
