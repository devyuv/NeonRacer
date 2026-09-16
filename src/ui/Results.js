import { formatTime } from './HUD.js';

const PLACE_SUFFIX = ['th', 'st', 'nd', 'rd'];
function ordinal(n) {
  const v = n % 100;
  return n + (PLACE_SUFFIX[(v - 20) % 10] || PLACE_SUFFIX[v] || PLACE_SUFFIX[0]);
}

export class ResultsView {
  constructor(root, { onNextRace, onGarage, onMainMenu }) {
    this.root = root.querySelector('#results-overlay');
    this.titleEl = root.querySelector('#results-title');
    this.placeEl = root.querySelector('#results-place');
    this.timeEl = root.querySelector('#results-time');
    this.bestLapEl = root.querySelector('#results-bestlap');
    this.coinsEl = root.querySelector('#results-coins');
    this.nextBtn = root.querySelector('#btn-next-race');

    root.querySelector('#btn-next-race').addEventListener('click', onNextRace);
    root.querySelector('#btn-results-garage').addEventListener('click', onGarage);
    root.querySelector('#btn-results-menu').addEventListener('click', onMainMenu);
  }

  show(results, { isChampionshipFinal = false } = {}) {
    const won = results.place === 1;
    this.titleEl.textContent = won ? 'RACE COMPLETE' : 'RACE FINISHED';
    this.placeEl.textContent = `${ordinal(results.place)} PLACE`;
    this.timeEl.textContent = formatTime(results.time);
    this.bestLapEl.textContent = isFinite(results.bestLap) ? formatTime(results.bestLap) : '--:--.--';
    this.coinsEl.textContent = '+' + results.coins;
    this.nextBtn.textContent = isChampionshipFinal ? 'FINISH' : 'NEXT RACE';
    this.root.classList.remove('hidden');
  }

  hide() {
    this.root.classList.add('hidden');
  }
}
