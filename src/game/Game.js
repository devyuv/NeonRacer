import { GameState } from './GameState.js';
import { RaceManager } from './RaceManager.js';
import { FollowCamera2D } from './Camera.js';
import { TRACK_LIST, buildTrack } from '../tracks/index.js';
import { CARS } from '../cars/CarData.js';
import { DeviceDetection } from '../utils/DeviceDetection.js';
import { KeyboardControls } from '../controls/KeyboardControls.js';
import { TouchControls } from '../controls/TouchControls.js';
import { AudioManager } from '../audio/AudioManager.js';
import { MainMenuView } from '../ui/MainMenu.js';
import { GarageView } from '../ui/Garage.js';
import { HUD } from '../ui/HUD.js';
import { ResultsView } from '../ui/Results.js';
import { SettingsView } from '../ui/Settings.js';

const TOP_LEVEL_SCREENS = [
  'loading-screen', 'webgl-error', 'main-menu', 'mode-select',
  'track-select', 'garage', 'settings', 'how-to-play', 'race-screen'
];

export class Game {
  constructor(root) {
    this.root = root;
    this.state = new GameState();
    this.audio = new AudioManager();
    this.keyboard = new KeyboardControls();
    this.touch = new TouchControls(root, this.state.settings.controlType);
    this.touch.setControlType(this.state.settings.controlType);

    this.deferredInstallPrompt = null;
    this.raceManager = null;
    this.camera = new FollowCamera2D();
    this.canvas = null;
    this.ctx = null;
    this.currentTrackData = null;
    this.animHandle = null;
    this.paused = false;
    this._lastTime = 0;
    this._raceScreenActive = false;

    this._initInstallPrompt();
    this._initUI();
    this._applyAudioSettings();
    window.addEventListener('resize', () => this._onResize());
    window.addEventListener('orientationchange', () => this._onResize());
  }

  // ---------- Boot / Loading ----------

  async boot() {
    const statusEl = document.getElementById('loading-status');
    const barEl = document.getElementById('loading-bar-fill');
    const setProgress = (pct, label) => {
      barEl.style.width = pct + '%';
      if (label) statusEl.textContent = label;
    };

    setProgress(10, 'Checking device capabilities...');
    await this._nextFrame();

    if (!DeviceDetection.supportsCanvas2D()) {
      this._showScreen('webgl-error');
      return;
    }

    setProgress(35, 'Preparing renderer...');
    await this._nextFrame();
    this._initRenderer();

    setProgress(65, 'Warming up scene...');
    await this._nextFrame();

    setProgress(90, 'Preparing track...');
    await this._nextFrame();

    setProgress(100, 'Ready.');
    await this._wait(150);

    this.mainMenu.updateCoins(this.state.save.coins);
    this._showScreen('main-menu');
  }

  _nextFrame() { return new Promise(r => requestAnimationFrame(r)); }
  _wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  _initRenderer() {
    const container = document.getElementById('canvas-container');
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    container.appendChild(this.canvas);
    this._applyRendererQuality();
  }

  _applyRendererQuality() {
    if (!this.canvas) return;
    const tier = this.state.settings.graphics;
    const dpr = tier === 'high' ? Math.min(window.devicePixelRatio || 1, 2) : tier === 'medium' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
    this._dpr = dpr;
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this._cssWidth = w;
    this._cssHeight = h;
  }

  _onResize() {
    if (this.canvas) this._applyRendererQuality();
    this._updateRotateHint();
  }

  _updateRotateHint() {
    const hint = document.getElementById('rotate-hint');
    if (!hint) return;
    const shouldShow = this._raceScreenActive && DeviceDetection.isMobile() && DeviceDetection.isPortrait();
    hint.classList.toggle('hidden', !shouldShow);
  }

  // ---------- UI wiring ----------

  _initUI() {
    this.mainMenu = new MainMenuView(this.root, {
      onPlay: () => { this.audio.unlock(); this.audio.playMenuClick(); this._showScreen('mode-select'); },
      onGarage: () => { this.audio.unlock(); this.audio.playMenuClick(); this._openGarage(); },
      onTracks: () => { this.audio.unlock(); this.audio.playMenuClick(); this._openTrackSelect(null); },
      onSettings: () => { this.audio.playMenuClick(); this.settingsView.refresh(); this._showScreen('settings'); },
      onHowToPlay: () => { this.audio.playMenuClick(); this._showScreen('how-to-play'); },
      onInstall: () => this._triggerInstall()
    });

    this.garageView = new GarageView(this.root);
    document.getElementById('garage-prev').addEventListener('click', () => this._cycleGarage(-1));
    document.getElementById('garage-next').addEventListener('click', () => this._cycleGarage(1));
    document.getElementById('garage-select').addEventListener('click', () => this._selectGarageCar());
    document.getElementById('garage-back').addEventListener('click', () => { this.garageView.stop(); this._showScreen('main-menu'); });

    document.getElementById('mode-back').addEventListener('click', () => this._showScreen('main-menu'));
    this.root.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.audio.playMenuClick();
        this.state.selectedMode = btn.dataset.mode;
        if (btn.dataset.mode === 'championship') {
          this.state.championship = { raceIndex: 0, totalPoints: 0, results: [] };
        }
        this._openTrackSelect(btn.dataset.mode);
      });
    });

    document.getElementById('track-back').addEventListener('click', () => this._showScreen('mode-select'));

    this.settingsView = new SettingsView(this.root, this.state, {
      onChange: (key, val) => {
        if (key === 'graphics') this._applyRendererQuality();
        if (key === 'music') this.audio.setMusic(val === 'on');
        if (key === 'sfx') this.audio.setSfx(val === 'on');
        if (key === 'controlType') this._applyControlType(val, { fromSettings: true });
      },
      onReset: () => { this.mainMenu.updateCoins(this.state.save.coins); }
    });

    this.tiltToggleBtn = document.getElementById('hud-tilt-toggle');
    this.tiltToggleBtn.addEventListener('click', () => this._toggleTiltMode());
    this._applyControlType(this.state.settings.controlType, { silent: true });
    document.getElementById('settings-back').addEventListener('click', () => this._showScreen(this._settingsReturnScreen || 'main-menu'));
    document.getElementById('howto-back').addEventListener('click', () => this._showScreen('main-menu'));

    this.hud = new HUD(this.root);
    this.resultsView = new ResultsView(this.root, {
      onNextRace: () => this._onNextRaceClicked(),
      onGarage: () => { this._teardownRace(); this._openGarage(); },
      onMainMenu: () => { this._teardownRace(); this._showScreen('main-menu'); }
    });

    document.getElementById('hud-pause').addEventListener('click', () => this._pauseRace());
    document.getElementById('btn-resume').addEventListener('click', () => this._resumeRace());
    document.getElementById('btn-restart').addEventListener('click', () => this._restartRace());
    document.getElementById('btn-pause-settings').addEventListener('click', () => {
      this._settingsReturnScreen = null;
      this.settingsView.refresh();
      document.getElementById('pause-overlay').classList.add('hidden');
      this._showScreen('settings');
    });
    document.getElementById('btn-quit').addEventListener('click', () => { this._teardownRace(); this._showScreen('main-menu'); });
  }

  // ---------- Control type (touch buttons vs. tilt steering) ----------

  /**
   * Switches steering between the on-screen L/R buttons and phone-tilt steering.
   * Used by both the Settings screen and the quick in-race tilt button, so the
   * two stay in sync no matter which one the player used.
   */
  _applyControlType(type, { fromSettings = false, silent = false } = {}) {
    this.touch.setControlType(type);
    if (!fromSettings) this.state.setSetting('controlType', type);
    if (this.settingsView) this.settingsView.refresh();

    const isTilt = type === 'tilt';
    this.tiltToggleBtn.classList.toggle('active', isTilt);
    document.getElementById('touch-controls').classList.toggle('tilt-mode', isTilt);

    if (!silent) this.audio.playMenuClick();
  }

  _toggleTiltMode() {
    this.audio.unlock(); // tilt permission prompts (iOS) need a user gesture, same as audio
    const next = this.state.settings.controlType === 'tilt' ? 'touch' : 'tilt';
    this._applyControlType(next);
  }

  _applyAudioSettings() {
    this.audio.setMusic(this.state.settings.music === 'on');
    this.audio.setSfx(this.state.settings.sfx === 'on');
  }

  _showScreen(id) {
    TOP_LEVEL_SCREENS.forEach(sid => {
      document.getElementById(sid).classList.toggle('hidden', sid !== id);
    });
    this._raceScreenActive = (id === 'race-screen');
    this._updateRotateHint();
    if (id !== 'settings') this._settingsReturnScreen = id;
  }

  // ---------- Garage ----------

  _openGarage() {
    this.garageIndex = this.state.garageIndex;
    this._refreshGarageDisplay();
    this._showScreen('garage');
    this.garageView.start();
  }

  _cycleGarage(dir) {
    this.audio.playMenuClick();
    this.garageIndex = (this.garageIndex + dir + CARS.length) % CARS.length;
    this._refreshGarageDisplay();
  }

  _refreshGarageDisplay() {
    const def = CARS[this.garageIndex];
    this.garageView.showCar(def);
    const selectBtn = document.getElementById('garage-select');
    const unlocked = this.state.isCarUnlocked(def.id);
    if (!unlocked) {
      selectBtn.textContent = `UNLOCK - 🪙${def.price}`;
    } else if (this.state.save.selectedCar === def.id) {
      selectBtn.textContent = 'SELECTED';
    } else {
      selectBtn.textContent = 'SELECT';
    }
  }

  _selectGarageCar() {
    const def = CARS[this.garageIndex];
    const unlocked = this.state.isCarUnlocked(def.id);
    this.audio.playMenuClick();
    if (!unlocked) {
      if (this.state.spendCoins(def.price)) {
        this.state.unlockCar(def.id);
        this.state.selectCar(def.id);
        this.mainMenu.updateCoins(this.state.save.coins);
      } else {
        alert('Not enough coins yet - win more races!');
        return;
      }
    } else {
      this.state.selectCar(def.id);
    }
    this.state.garageIndex = this.garageIndex;
    this._refreshGarageDisplay();
  }

  // ---------- Track select ----------

  _openTrackSelect(modeOverride) {
    if (modeOverride) this.state.selectedMode = modeOverride;
    const listEl = document.getElementById('track-list');
    listEl.innerHTML = '';
    TRACK_LIST.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'track-btn' + (t.implemented ? '' : ' locked');
      btn.innerHTML = `<strong>${t.name}</strong><span>${t.description}</span>`;
      if (t.implemented) {
        btn.addEventListener('click', () => {
          this.audio.playMenuClick();
          this.state.selectedTrackId = t.id;
          this._startRace();
        });
      } else {
        btn.disabled = true;
      }
      listEl.appendChild(btn);
    });
    this._showScreen('track-select');
  }

  // ---------- Race flow ----------

  _startRace() {
    if (!this.canvas) this._initRenderer();
    this._teardownRace(); // clear any previous race

    const trackData = buildTrack(this.state.selectedTrackId, this.state.settings.graphics);
    this.currentTrackData = trackData;

    this.raceManager = new RaceManager({
      trackData,
      playerCarId: this.state.save.selectedCar,
      mode: this.state.selectedMode,
      laps: trackData.laps,
      onPlayerCollision: () => this._onPlayerCollision()
    });

    this.camera._initialized = false;
    this.audio.startEngine();

    this._showScreen('race-screen');
    document.getElementById('pause-overlay').classList.add('hidden');
    this.resultsView.hide();
    document.getElementById('touch-controls').classList.toggle('hidden', !DeviceDetection.isTouch());
    this.paused = false;

    this._runCountdown(() => {
      this.raceManager.beginRace();
      this.hud.show();
      this._lastTime = performance.now();
      this._loop();
    });
  }

  _runCountdown(onComplete) {
    const seq = [3, 2, 1, 0];
    let i = 0;
    const step = () => {
      const val = seq[i];
      this.hud.showCountdown(val);
      if (val > 0) this.audio.playCountdownTick(); else this.audio.playCountdownGo();
      i++;
      if (i < seq.length) {
        setTimeout(step, 800);
      } else {
        setTimeout(() => { this.hud.hideCountdown(); onComplete(); }, 500);
      }
    };
    step();
  }

  _loop() {
    if (this.paused || !this.raceManager) return;
    this.animHandle = requestAnimationFrame(() => this._loop());

    const now = performance.now();
    const dt = Math.min(0.05, (now - this._lastTime) / 1000);
    this._lastTime = now;

    const input = this._getCombinedInput();
    this.raceManager.update(dt, input);

    const p = this.raceManager.player;
    const maxSpeedWithNitro = p.def.physics.maxSpeed * p.def.physics.nitroMultiplier;
    const speedRatio = Math.abs(p.state.speed) / maxSpeedWithNitro;
    this.camera.update(dt, p.state.x, p.state.y, speedRatio);
    this.audio.updateEngine(Math.abs(p.state.speed) / p.def.physics.maxSpeed);

    const ranked = this.raceManager.getPositions();
    this.hud.update({
      position: ranked.indexOf(p) + 1,
      totalCars: this.raceManager.allCars.length,
      lap: p.lap,
      laps: this.raceManager.laps,
      timeSeconds: this.raceManager.raceTime,
      speedKmh: p.getSpeedKmh(),
      nitro: p.state.nitro,
      showLapCounter: this.raceManager.mode !== 'free-drive'
    });

    this._render();

    if (this.raceManager.finished) {
      this._onRaceFinished();
    }
  }

  _render() {
    const ctx = this.ctx;
    const w = this._cssWidth, h = this._cssHeight;
    ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    ctx.fillStyle = this.currentTrackData.backgroundColor || '#0a0a14';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    this.camera.apply(ctx, w, h);
    const viewBounds = this.camera.getViewBounds(w, h);
    this.currentTrackData.draw(ctx, viewBounds);
    this.raceManager.drawCars(ctx);
    ctx.restore();
  }

  _getCombinedInput() {
    const kb = this.keyboard.getInput();
    const tc = this.touch.getInput();
    return {
      throttle: Math.max(kb.throttle, tc.throttle),
      brake: kb.brake || tc.brake,
      steer: Math.abs(kb.steer) > Math.abs(tc.steer) ? kb.steer : tc.steer,
      nitro: kb.nitro || tc.nitro
    };
  }

  _onPlayerCollision() {
    this.camera.triggerShake(8, 0.3);
    this.audio.playCollision();
    DeviceDetection.vibrate(this.state.settings.vibration === 'on' ? 60 : 0);
  }

  _onRaceFinished() {
    cancelAnimationFrame(this.animHandle);
    this.audio.stopEngine();
    this.audio.playFinish();
    this.hud.hide();

    const results = this.raceManager.results;
    this.state.addCoins(results.coins);
    if (isFinite(results.bestLap)) {
      this.state.recordLapTime(this.state.selectedTrackId, results.bestLap);
    }
    this.mainMenu.updateCoins(this.state.save.coins);

    let isChampionshipFinal = false;
    if (this.state.selectedMode === 'championship') {
      this.state.championship.raceIndex += 1;
      this.state.championship.totalPoints += Math.max(0, 10 - (results.place - 1) * 2);
      isChampionshipFinal = this.state.championship.raceIndex >= 3;
    }

    this.resultsView.show(results, { isChampionshipFinal });
  }

  _onNextRaceClicked() {
    this.audio.playMenuClick();
    // Championship keeps racing the same circuit and accumulating points for 3 races
    // (see RaceManager finish handling in Game.js), then returns to the menu naturally
    // when the player chooses MAIN MENU from the results screen.
    if (this.state.selectedMode === 'championship' && this.state.championship.raceIndex >= 3) {
      this.state.championship = { raceIndex: 0, totalPoints: 0, results: [] };
    }
    this._startRace();
  }

  _pauseRace() {
    if (!this.raceManager || this.raceManager.finished) return;
    this.paused = true;
    cancelAnimationFrame(this.animHandle);
    document.getElementById('pause-overlay').classList.remove('hidden');
  }

  _resumeRace() {
    document.getElementById('pause-overlay').classList.add('hidden');
    this.paused = false;
    this._lastTime = performance.now();
    this._loop();
  }

  _restartRace() {
    document.getElementById('pause-overlay').classList.add('hidden');
    this._startRace();
  }

  _teardownRace() {
    if (this.animHandle) cancelAnimationFrame(this.animHandle);
    this.animHandle = null;
    this.paused = false;
    this.audio.stopEngine();
    if (this.raceManager) {
      this.raceManager.dispose();
      this.raceManager = null;
    }
    this.currentTrackData = null;
  }

  // ---------- PWA install ----------

  _initInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      this.mainMenu?.showInstallButton(true);
    });
    window.addEventListener('appinstalled', () => {
      this.deferredInstallPrompt = null;
      this.mainMenu?.showInstallButton(false);
    });
  }

  async _triggerInstall() {
    if (!this.deferredInstallPrompt) return;
    this.deferredInstallPrompt.prompt();
    await this.deferredInstallPrompt.userChoice;
    this.deferredInstallPrompt = null;
    this.mainMenu.showInstallButton(false);
  }
}
