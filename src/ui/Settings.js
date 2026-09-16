export class SettingsView {
  constructor(root, gameState, { onChange, onReset }) {
    this.gameState = gameState;
    this.onChange = onChange;
    this.onReset = onReset;

    this.groups = {
      graphics: root.querySelector('#set-graphics'),
      music: root.querySelector('#set-music'),
      sfx: root.querySelector('#set-sfx'),
      vibration: root.querySelector('#set-vibration'),
      controlType: root.querySelector('#set-controls')
    };

    Object.entries(this.groups).forEach(([key, group]) => {
      if (!group) return;
      group.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          this._setActive(group, btn);
          const settingsKey = key === 'controlType' ? 'controlType' : key;
          this.gameState.setSetting(settingsKey, btn.dataset.val);
          if (this.onChange) this.onChange(settingsKey, btn.dataset.val);
        });
      });
    });

    const resetBtn = root.querySelector('#btn-reset-progress');
    resetBtn.addEventListener('click', () => {
      const confirmed = window.confirm('Reset ALL progress? This will erase unlocked cars, tracks, coins and best times. This cannot be undone.');
      if (confirmed) {
        this.gameState.resetProgress();
        this.refresh();
        if (this.onReset) this.onReset();
      }
    });

    this.refresh();
  }

  _setActive(group, activeBtn) {
    group.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === activeBtn));
  }

  refresh() {
    const s = this.gameState.settings;
    Object.entries(this.groups).forEach(([key, group]) => {
      if (!group) return;
      const value = s[key];
      group.querySelectorAll('button').forEach(b => {
        b.classList.toggle('active', b.dataset.val === value);
      });
    });
  }
}
