import { Storage } from '../utils/Storage.js';
import { DeviceDetection } from '../utils/DeviceDetection.js';
import { CARS } from '../cars/CarData.js';

export class GameState {
  constructor() {
    this.save = Storage.load();
    if (!this.save.settings.graphics) {
      this.save.settings.graphics = DeviceDetection.suggestedGraphicsTier();
      this.persist();
    }
    this.garageIndex = Math.max(0, CARS.findIndex(c => c.id === this.save.selectedCar));

    // session-only selections
    this.selectedMode = 'quick';
    this.selectedTrackId = 'neon-city';
    this.championship = { raceIndex: 0, totalPoints: 0, results: [] };
  }

  persist() {
    Storage.save(this.save);
  }

  get settings() { return this.save.settings; }

  setSetting(key, value) {
    this.save.settings[key] = value;
    this.persist();
  }

  getSelectedCarDef() {
    return CARS.find(c => c.id === this.save.selectedCar) || CARS[0];
  }

  selectCar(carId) {
    this.save.selectedCar = carId;
    this.persist();
  }

  isCarUnlocked(carId) {
    return this.save.unlockedCars.includes(carId);
  }

  unlockCar(carId) {
    if (!this.save.unlockedCars.includes(carId)) {
      this.save.unlockedCars.push(carId);
      this.persist();
    }
  }

  isTrackUnlocked(trackId) {
    return this.save.unlockedTracks.includes(trackId);
  }

  addCoins(amount) {
    this.save.coins += amount;
    this.persist();
  }

  spendCoins(amount) {
    if (this.save.coins >= amount) {
      this.save.coins -= amount;
      this.persist();
      return true;
    }
    return false;
  }

  recordLapTime(trackId, seconds) {
    const best = this.save.bestLaps[trackId];
    if (!best || seconds < best) {
      this.save.bestLaps[trackId] = seconds;
      this.persist();
      return true;
    }
    return false;
  }

  resetProgress() {
    this.save = Storage.reset();
    this.save.settings.graphics = DeviceDetection.suggestedGraphicsTier();
    this.persist();
  }
}
