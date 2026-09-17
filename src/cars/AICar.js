import { drawCar } from './CarModel.js';
import { createCarState, stepCarPhysics } from '../game/Physics.js';

const LOOKAHEAD = 90; // world units to look ahead on the centerline for steering target

export class AICar {
  constructor(carDef, track, startIndex, skill = 0.85) {
    this.def = carDef;
    this.skill = skill; // 0..1, imperfection factor (lower = more mistakes / slower reactions)
    this.targetSpeedFactor = 0.72 + skill * 0.28;
    this.progressIndex = startIndex;
    this.lap = 1;
    this.finished = false;
    this.isPlayer = false;
    this.name = 'RIVAL';
    this.recoverTimer = 0;
    this._mistakeTimer = Math.random() * 4;
    this._wobble = 0;

    const p = track.centerline[startIndex];
    const pNext = track.centerline[(startIndex + 1) % track.centerline.length];
    const heading = Math.atan2(pNext.x - p.x, -(pNext.y - p.y));
    this.state = createCarState(p.x, p.y, heading);
  }

  update(dt, track, otherCars) {
    const n = track.centerline.length;
    this.progressIndex = this._advanceProgressIndex(track);
    const lookSteps = Math.max(2, Math.round(LOOKAHEAD / (track.length / n)));
    const targetIdx = (this.progressIndex + lookSteps) % n;
    const target = track.centerline[targetIdx];

    this._mistakeTimer -= dt;
    let aimX = target.x, aimY = target.y;
    if (this._mistakeTimer < 0) {
      this._mistakeTimer = 2 + Math.random() * 4;
      this._wobble = (Math.random() - 0.5) * (1 - this.skill) * 40;
    }
    if (this._wobble) {
      aimX += this._wobble;
      aimY += this._wobble;
    }

    const toTarget = Math.atan2(aimX - this.state.x, -(aimY - this.state.y));
    let angleDiff = toTarget - this.state.heading;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const steer = Math.max(-1, Math.min(1, angleDiff * 1.8));

    // Basic overtaking: if a car directly ahead within range, nudge sideways
    let overtakeSteer = 0;
    if (otherCars) {
      for (const other of otherCars) {
        if (other === this) continue;
        const dx = other.state.x - this.state.x;
        const dy = other.state.y - this.state.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 46 && dist > 0.1) {
          const facing = Math.sin(this.state.heading) * dx - Math.cos(this.state.heading) * dy;
          if (facing > 0 && facing < 60) {
            overtakeSteer += (Math.random() > 0.5 ? 0.4 : -0.4);
          }
        }
      }
    }

    let recovering = false;
    if (track.isOffRoad(this.state.x, this.state.y, this.progressIndex)) {
      this.recoverTimer += dt;
      recovering = true;
    } else {
      this.recoverTimer = 0;
    }

    const input = {
      throttle: recovering ? 0.4 : 1,
      steer: Math.max(-1, Math.min(1, steer + overtakeSteer)),
      brake: recovering && this.recoverTimer > 0.6,
      nitro: !recovering && Math.random() < 0.002
    };
    this._lastInput = input;

    const tuning = { ...this.def.physics, maxSpeed: this.def.physics.maxSpeed * this.targetSpeedFactor };
    stepCarPhysics(this.state, input, tuning, dt, (x, y) => track.isOffRoad(x, y, this.progressIndex));

    return this.state;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.state.x, this.state.y);
    ctx.rotate(this.state.heading);
    drawCar(ctx, this.def, {
      braking: !!(this._lastInput && this._lastInput.brake),
      nitroActive: this.state.nitroActive,
      driftAmount: this.state.driftAmount
    });
    ctx.restore();
  }

  _advanceProgressIndex(track) {
    const n = track.centerline.length;
    let best = Infinity, bestI = this.progressIndex;
    for (let offset = -5; offset <= 15; offset++) {
      const i = ((this.progressIndex + offset) % n + n) % n;
      const p = track.centerline[i];
      const d = (p.x - this.state.x) * (p.x - this.state.x) + (p.y - this.state.y) * (p.y - this.state.y);
      if (d < best) { best = d; bestI = i; }
    }
    return bestI;
  }
}
