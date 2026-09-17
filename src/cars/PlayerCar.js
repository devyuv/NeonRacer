import { drawCar } from './CarModel.js';
import { createCarState, stepCarPhysics } from '../game/Physics.js';

export class PlayerCar {
  constructor(carDef, startX, startY, startHeading) {
    this.def = carDef;
    this.state = createCarState(startX, startY, startHeading);
    this.lap = 1;
    this.progressIndex = 0;
    this.finished = false;
    this.isPlayer = true;
    this.name = 'YOU';
  }

  update(dt, input, track) {
    const idxHint = this.progressIndex;
    stepCarPhysics(this.state, input, this.def.physics, dt, (x, y) => track.isOffRoad(x, y, idxHint));
    this._lastInput = input;
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

  getSpeedKmh() {
    return Math.max(0, Math.round(this.state.speed * 5.4));
  }
}
