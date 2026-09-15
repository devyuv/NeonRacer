const KEY = "neon-racer-save-v1";
const defaults = {
  coins: 0, trophies: 0, racePoints: 0,
  unlockedCars: ["VELOCITY-X"],
  unlockedTracks: ["NEON CITY"],
  bestTimes: {}, bestLaps: {},
  championship: 0,
  settings: { graphics: "MEDIUM", music: true, sfx: true, vibration: true, control: "TOUCH" }
};
export function loadSave() {
  try { return {...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}")}; }
  catch { return structuredClone(defaults); }
}
export function saveProgress(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
export function resetProgress() {
  localStorage.removeItem(KEY);
  return loadSave();
}