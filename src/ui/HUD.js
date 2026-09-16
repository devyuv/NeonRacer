export class HUD {
  constructor(root) {
    this.positionEl = root.querySelector('#hud-position');
    this.lapEl = root.querySelector('#hud-lap');
    this.timeEl = root.querySelector('#hud-time');
    this.speedEl = root.querySelector('#hud-speed');
    this.nitroFillEl = root.querySelector('#nitro-bar-fill');
    this.hudRoot = root.querySelector('#hud');
    this.countdownRoot = root.querySelector('#countdown');
    this.countdownNum = root.querySelector('#countdown-num');
  }

  show() { this.hudRoot.classList.remove('hidden'); }
  hide() { this.hudRoot.classList.add('hidden'); }

  update({ position, totalCars, lap, laps, timeSeconds, speedKmh, nitro, showLapCounter }) {
    this.positionEl.textContent = `${position} / ${totalCars}`;
    this.lapEl.textContent = showLapCounter === false ? '-' : `${Math.min(lap, laps)} / ${laps}`;
    this.timeEl.textContent = formatTime(timeSeconds);
    this.speedEl.textContent = speedKmh;
    this.nitroFillEl.style.width = Math.round(nitro * 100) + '%';
  }

  showCountdown(num) {
    this.countdownRoot.classList.remove('hidden');
    this.countdownNum.textContent = num > 0 ? String(num) : 'GO!';
    // restart CSS animation
    this.countdownNum.style.animation = 'none';
    void this.countdownNum.offsetWidth;
    this.countdownNum.style.animation = '';
  }

  hideCountdown() {
    this.countdownRoot.classList.add('hidden');
  }
}

export function formatTime(totalSeconds) {
  if (!isFinite(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.floor((totalSeconds % 1) * 100);
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${pad(minutes)}:${pad(seconds)}.${pad(millis)}`;
}
