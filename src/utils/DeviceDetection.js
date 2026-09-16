export const DeviceDetection = {
  isTouch() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  },

  isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || this.isTouch();
  },

  isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  },

  supportsWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  },

  supportsVibration() {
    return 'vibrate' in navigator;
  },

  vibrate(pattern) {
    if (this.supportsVibration()) {
      try { navigator.vibrate(pattern); } catch (e) { /* ignore */ }
    }
  },

  // Rough heuristic for default graphics tier
  suggestedGraphicsTier() {
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;
    if (!this.isMobile() && cores >= 6) return 'high';
    if (this.isMobile() && (cores <= 4 || mem <= 4)) return 'low';
    return 'medium';
  },

  isPortrait() {
    return window.innerHeight > window.innerWidth;
  }
};
