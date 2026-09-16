import { buildCarMesh } from './CarModel.js';
import { createCarState, stepCarPhysics } from '../game/Physics.js';

const LOOKAHEAD = 14; // world units to look ahead on the centerline for steering target

export class AICar {
  constructor(carDef, track, startIndex, skill = 0.85) {
    this.def = carDef;
    const built = buildCarMesh(carDef, { withLights: false });
    this.mesh = built.group;
    this.wheels = built.wheels;

    this.skill = skill; // 0..1, imperfection factor (lower = more mistakes / slower reactions)
    this.targetSpeedFactor = 0.72 + skill * 0.28; // AI doesn't always use full max speed
    this.progressIndex = startIndex;
    this.lap = 1;
    this.finished = false;
    this.raceTime = 0;
    this.recoverTimer = 0;

    const p = track.centerline[startIndex];
    const pNext = track.centerline[(startIndex + 1) % track.centerline.length];
    const heading = Math.atan2(pNext.x - p.x, pNext.z - p.z);
    this.state = createCarState(p.x, p.z, heading);
    this.mesh.position.set(p.x, 0, p.z);
    this.mesh.rotation.y = heading;

    this._mistakeTimer = Math.random() * 4;
  }

  update(dt, track, otherCars) {
    // Find a lookahead target point along the centerline ahead of our current progress
    const n = track.centerline.length;
    this.progressIndex = this._advanceProgressIndex(track);
    const lookSteps = Math.max(2, Math.round(LOOKAHEAD / (track.length / n)));
    const targetIdx = (this.progressIndex + lookSteps) % n;
    const target = track.centerline[targetIdx];

    // Occasional small aiming error to avoid perfect robotic driving
    this._mistakeTimer -= dt;
    let aimX = target.x, aimZ = target.z;
    if (this._mistakeTimer < 0) {
      this._mistakeTimer = 2 + Math.random() * 4;
      this._wobble = (Math.random() - 0.5) * (1 - this.skill) * 6;
    }
    if (this._wobble) {
      aimX += this._wobble;
      aimZ += this._wobble;
    }

    const toTarget = Math.atan2(aimX - this.state.x, aimZ - this.state.z);
    let angleDiff = toTarget - this.state.heading;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const steer = Math.max(-1, Math.min(1, angleDiff * 1.8));

    // Basic overtaking: if a car directly ahead within range and slower, nudge sideways
    let overtakeSteer = 0;
    if (otherCars) {
      for (const other of otherCars) {
        if (other === this) continue;
        const dx = other.state.x - this.state.x;
        const dz = other.state.z - this.state.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 8 && dist > 0.1) {
          const facing = Math.sin(this.state.heading) * dx + Math.cos(this.state.heading) * dz;
          if (facing > 0 && facing < 10) {
            overtakeSteer += (Math.random() > 0.5 ? 0.4 : -0.4);
          }
        }
      }
    }

    let recovering = false;
    if (track.isOffRoad(this.state.x, this.state.z, this.progressIndex)) {
      this.recoverTimer += dt;
      recovering = true;
    } else {
      this.recoverTimer = 0;
    }

    const input = {
      throttle: recovering ? 0.4 : 1,
      steer: Math.max(-1, Math.min(1, steer + overtakeSteer)),
      brake: recovering && this.recoverTimer > 0.6,
      nitro: !recovering && Math.random() < 0.002 // occasional AI nitro bursts
    };

    const tuning = { ...this.def.physics, maxSpeed: this.def.physics.maxSpeed * this.targetSpeedFactor };
    stepCarPhysics(this.state, input, tuning, dt, (x, z) => track.isOffRoad(x, z, this.progressIndex));

    this.mesh.position.set(this.state.x, 0, this.state.z);
    this.mesh.rotation.y = this.state.heading;
    const wheelSpin = this.state.speed * dt * 1.6;
    this.wheels.forEach(w => { w.rotation.x += wheelSpin; });

    return this.state;
  }

  _advanceProgressIndex(track) {
    // Search a small forward window from current index for the closest point (cheap + robust)
    const n = track.centerline.length;
    let best = Infinity, bestI = this.progressIndex;
    for (let offset = -5; offset <= 15; offset++) {
      const i = ((this.progressIndex + offset) % n + n) % n;
      const p = track.centerline[i];
      const d = (p.x - this.state.x) * (p.x - this.state.x) + (p.z - this.state.z) * (p.z - this.state.z);
      if (d < best) { best = d; bestI = i; }
    }
    return bestI;
  }
}
