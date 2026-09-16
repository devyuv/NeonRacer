import { buildCarMesh } from './CarModel.js';
import { createCarState, stepCarPhysics } from '../game/Physics.js';

export class PlayerCar {
  constructor(carDef, startX, startZ, startHeading) {
    this.def = carDef;
    const built = buildCarMesh(carDef, { withLights: true });
    this.mesh = built.group;
    this.wheels = built.wheels;
    this.brakeMaterial = built.brakeMaterial;
    this.state = createCarState(startX, startZ, startHeading);
    this.lap = 1;
    this.progressIndex = 0;
    this.finished = false;
    this.raceTime = 0;
    this.bestLapTime = Infinity;
    this.currentLapStartTime = 0;

    this.mesh.position.set(startX, 0, startZ);
    this.mesh.rotation.y = startHeading;

    this._exhaustParticles = [];
  }

  update(dt, input, track) {
    const idxHint = this.progressIndex;
    stepCarPhysics(this.state, input, this.def.physics, dt, (x, z) => track.isOffRoad(x, z, idxHint));

    this.mesh.position.set(this.state.x, 0, this.state.z);
    this.mesh.rotation.y = this.state.heading;
    // slight body roll/tilt while turning or drifting for visual flair
    const targetTilt = -input.steer * 0.12 * Math.min(1, Math.abs(this.state.speed) / 30);
    this.mesh.rotation.z += (targetTilt - this.mesh.rotation.z) * Math.min(1, dt * 6);

    // spin wheels
    const wheelSpin = this.state.speed * dt * 1.6;
    this.wheels.forEach(w => { w.rotation.x += wheelSpin; });

    // brake light intensity
    this.brakeMaterial.emissiveIntensity = input.brake ? 1.6 : 0.4;

    return this.state;
  }

  getSpeedKmh() {
    return Math.max(0, Math.round(this.state.speed * 5.4));
  }
}
