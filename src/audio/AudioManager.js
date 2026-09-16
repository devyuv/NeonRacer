// All sounds here are synthesized at runtime with the WebAudio API - there are no
// external audio files to license or attribute. This keeps the game fully
// self-contained while still providing real audio feedback.
//
// To swap in your own licensed music/SFX later: drop files into /public/assets/audio/
// and replace the relevant method bodies below with HTMLAudioElement/AudioBufferSourceNode
// playback of those files. The public API (playEngine, playCollision, etc.) can stay the same.
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicOn = true;
    this.sfxOn = true;
    this.musicGain = null;
    this.sfxGain = null;
    this._engineNode = null;
    this._engineGain = null;
    this._unlocked = false;
  }

  _ensureContext() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicOn ? 0.25 : 0;
    this.musicGain.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxOn ? 0.5 : 0;
    this.sfxGain.connect(this.ctx.destination);
  }

  /** Must be called from a user gesture (button tap) to satisfy browser autoplay policies. */
  unlock() {
    this._ensureContext();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this._unlocked = true;
  }

  setMusic(on) { this.musicOn = on; if (this.musicGain) this.musicGain.gain.value = on ? 0.25 : 0; }
  setSfx(on) { this.sfxOn = on; if (this.sfxGain) this.sfxGain.gain.value = on ? 0.5 : 0; }

  _blip(freq, duration, type = 'sine', gainValue = 0.3, target = 'sfx') {
    if (!this.ctx || !this.sfxOn) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = gainValue;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(target === 'music' ? this.musicGain : this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playMenuClick() { this._ensureContext(); this._blip(660, 0.08, 'square', 0.15); }
  playCountdownTick() { this._ensureContext(); this._blip(440, 0.15, 'sine', 0.3); }
  playCountdownGo() { this._ensureContext(); this._blip(880, 0.35, 'sawtooth', 0.35); }
  playCollision() { this._ensureContext(); this._blip(120, 0.25, 'square', 0.4); }
  playNitro() { this._ensureContext(); this._blip(200, 0.4, 'sawtooth', 0.25); }
  playFinish() {
    this._ensureContext();
    if (!this.ctx) return;
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => this._blip(f, 0.3, 'triangle', 0.25), i * 120);
    });
  }

  /** Continuous engine drone whose pitch/volume follow speed. Call startEngine once, then updateEngine each frame. */
  startEngine() {
    this._ensureContext();
    if (!this.ctx || this._engineNode) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 60;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    this._engineNode = osc;
    this._engineGain = gain;
  }

  updateEngine(speedRatio) {
    if (!this._engineNode || !this.ctx) return;
    const freq = 55 + Math.min(1, Math.max(0, speedRatio)) * 220;
    this._engineNode.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.08);
    this._engineGain.gain.setTargetAtTime(this.sfxOn ? 0.06 + speedRatio * 0.08 : 0, this.ctx.currentTime, 0.1);
  }

  stopEngine() {
    if (this._engineNode) {
      try { this._engineNode.stop(); } catch (e) { /* already stopped */ }
      this._engineNode.disconnect();
      this._engineGain.disconnect();
      this._engineNode = null;
      this._engineGain = null;
    }
  }
}
