import { PlayerCar } from '../cars/PlayerCar.js';
import { AICar } from '../cars/AICar.js';
import { getCarById, CARS } from '../cars/CarData.js';
import { resolveCarCollisions, resolveTrackBounds } from './Collision.js';

const AI_SKILL_SPREAD = [0.55, 0.65, 0.75, 0.85, 0.95];

export class RaceManager {
  constructor({ trackData, playerCarId, mode, laps, onPlayerCollision }) {
    this.trackData = trackData;
    this.track = trackData.track;
    this.mode = mode; // 'quick' | 'time-trial' | 'championship' | 'free-drive'
    this.laps = laps || trackData.laps || 3;
    this.onPlayerCollision = onPlayerCollision;
    this.raceTime = 0;
    this.finished = false;
    this.countdownActive = true;
    this.results = null;
    this.n = this.track.centerline.length;

    const start = this.track.startPoint;
    const heading = this.track.startHeading;

    const playerDef = getCarById(playerCarId);
    this.player = new PlayerCar(playerDef, start.x, start.y, heading);

    this.aiCars = [];
    if (mode !== 'free-drive' && mode !== 'time-trial') {
      const opponentPool = CARS.filter(c => c.id !== playerCarId).concat(CARS);
      const count = 5;
      for (let i = 0; i < count; i++) {
        const def = opponentPool[i % opponentPool.length];
        // stagger AI starting positions slightly behind the player, side by side
        const offsetIndex = (this._findStartIndex() - (i + 1) * 2 + this.n) % this.n;
        const ai = new AICar(def, this.track, offsetIndex, AI_SKILL_SPREAD[i % AI_SKILL_SPREAD.length]);
        ai.name = 'RIVAL ' + (i + 1);
        this.aiCars.push(ai);
      }
    }

    this.allCars = [this.player, ...this.aiCars];
    this.bestLapThisRace = Infinity;
    this.currentLapStart = 0;
  }

  _findStartIndex() {
    return this.track.nearestIndex(this.track.startPoint.x, this.track.startPoint.y);
  }

  beginRace() {
    this.countdownActive = false;
    this.raceTime = 0;
    this.currentLapStart = 0;
  }

  update(dt, input) {
    if (this.finished) return;

    if (!this.countdownActive) {
      this.raceTime += dt;
    }

    const effectiveInput = this.countdownActive
      ? { throttle: 0, brake: false, steer: 0, nitro: false }
      : input;

    this.player.update(dt, effectiveInput, this.track);
    this._trackLapProgress(this.player);

    this.aiCars.forEach(ai => {
      if (!this.countdownActive) {
        ai.update(dt, this.track, this.aiCars.concat([this.player]));
        this._trackLapProgress(ai);
      }
    });

    resolveCarCollisions(this.allCars, () => {
      if (this.onPlayerCollision) this.onPlayerCollision();
    });
    this.allCars.forEach(car => {
      resolveTrackBounds(car.state, this.track, () => {
        if (this.onPlayerCollision) this.onPlayerCollision();
      }, car.isPlayer);
    });

    this._checkFinish();
  }

  _trackLapProgress(car) {
    const idx = this.track.nearestIndex(car.state.x, car.state.y);
    if (car._lastIdx === undefined) car._lastIdx = idx;

    // Detect crossing the start/finish line (index wraps from near-end to near-zero)
    const n = this.n;
    const wrapped = car._lastIdx > n * 0.7 && idx < n * 0.3;
    if (wrapped && !car.finished) {
      const lapTime = car.isPlayer ? (this.raceTime - this.currentLapStart) : null;
      if (car.isPlayer) {
        this.currentLapStart = this.raceTime;
        if (lapTime && lapTime < this.bestLapThisRace) this.bestLapThisRace = lapTime;
      }
      car.lap += 1;
      if (car.lap > this.laps) {
        car.finished = true;
        car.finishTime = this.raceTime;
      }
    }
    car._lastIdx = idx;
    car.progressIndex = idx;
  }

  _checkFinish() {
    if (this.mode === 'free-drive') return; // never "finishes"
    if (this.player.finished && !this.finished) {
      this.finished = true;
      this._computeResults();
    }
  }

  getPositions() {
    // Rank by lap then by progress index (approx distance along track this lap)
    const ranked = [...this.allCars].sort((a, b) => {
      const aScore = a.lap * this.n + a.progressIndex;
      const bScore = b.lap * this.n + b.progressIndex;
      return bScore - aScore;
    });
    return ranked;
  }

  getPlayerPosition() {
    const ranked = this.getPositions();
    return ranked.indexOf(this.player) + 1;
  }

  _computeResults() {
    const place = this.getPlayerPosition();
    const coinsEarned = Math.max(50, 260 - (place - 1) * 40);
    this.results = {
      place,
      totalCars: this.allCars.length,
      time: this.player.finishTime,
      bestLap: this.bestLapThisRace,
      coins: coinsEarned
    };
  }

  /** Draws every car onto a 2D context that's already in world space (camera transform applied). */
  drawCars(ctx) {
    this.aiCars.forEach(ai => ai.draw(ctx));
    this.player.draw(ctx);
  }

  dispose() {
    // No GPU resources to free in the 2D canvas renderer - nothing to do here.
  }
}
