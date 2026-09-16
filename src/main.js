import { Game } from './game/Game.js';

// Two-finger gestures (steering + nitro/brake at the same time is normal in this game)
// can otherwise be misread by iOS Safari as its native pinch/rotate page gesture,
// visibly spinning or zooming the whole page. Block that outright.
['gesturestart', 'gesturechange', 'gestureend'].forEach(evt => {
  document.addEventListener(evt, (e) => e.preventDefault());
});

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
