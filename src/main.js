import { Game } from './game/Game.js';

const root = document.getElementById('app');
const game = new Game(root);
game.boot();

// Register the service worker for offline play + installability.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
