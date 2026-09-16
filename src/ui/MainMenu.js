export class MainMenuView {
  constructor(root, { onPlay, onGarage, onTracks, onSettings, onHowToPlay, onInstall }) {
    this.root = root.querySelector('#main-menu');
    this.coinCountEl = root.querySelector('#coin-count');
    this.installBtn = root.querySelector('#btn-install');

    root.querySelector('#btn-play').addEventListener('click', onPlay);
    root.querySelector('#btn-garage').addEventListener('click', onGarage);
    root.querySelector('#btn-tracks').addEventListener('click', onTracks);
    root.querySelector('#btn-settings').addEventListener('click', onSettings);
    root.querySelector('#btn-how-to-play').addEventListener('click', onHowToPlay);
    this.installBtn.addEventListener('click', onInstall);
  }

  updateCoins(coins) {
    this.coinCountEl.textContent = coins;
  }

  showInstallButton(show) {
    this.installBtn.classList.toggle('hidden', !show);
  }
}
