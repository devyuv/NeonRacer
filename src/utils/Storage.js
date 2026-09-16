const KEY = 'neon-racer-3d-save-v1';

const DEFAULT_SAVE = {
  coins: 0,
  trophies: 0,
  racePoints: 0,
  unlockedCars: ['velocity-x'],
  selectedCar: 'velocity-x',
  unlockedTracks: ['neon-city'],
  bestLaps: {},      // trackId -> seconds
  championshipProgress: { started: false, raceIndex: 0, points: 0 },
  settings: {
    graphics: null,   // resolved at first run via DeviceDetection
    music: 'on',
    sfx: 'on',
    vibration: 'on',
    controlType: 'touch'
  }
};

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

export const Storage = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULT_SAVE);
      const parsed = JSON.parse(raw);
      // merge with defaults so new fields survive updates
      return { ...clone(DEFAULT_SAVE), ...parsed, settings: { ...DEFAULT_SAVE.settings, ...(parsed.settings || {}) } };
    } catch (e) {
      console.warn('Save data corrupted, resetting.', e);
      return clone(DEFAULT_SAVE);
    }
  },

  save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Could not save progress (storage unavailable).', e);
      return false;
    }
  },

  reset() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    return clone(DEFAULT_SAVE);
  }
};
