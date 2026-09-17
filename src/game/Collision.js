import { applyCollisionImpulse } from './Physics.js';

const CAR_RADIUS = 14;

/** Resolves simple circle-circle collisions between all provided car states. */
export function resolveCarCollisions(cars, onPlayerHit) {
  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i], b = cars[j];
      const dx = b.state.x - a.state.x;
      const dy = b.state.y - a.state.y;
      const dist = Math.hypot(dx, dy);
      const minDist = CAR_RADIUS * 2;
      if (dist < minDist && dist > 0.001) {
        const overlap = (minDist - dist) / 2;
        const nx = dx / dist, ny = dy / dist;
        a.state.x -= nx * overlap;
        a.state.y -= ny * overlap;
        b.state.x += nx * overlap;
        b.state.y += ny * overlap;

        applyCollisionImpulse(a.state, -nx, -ny, 4);
        applyCollisionImpulse(b.state, nx, ny, 4);

        if (onPlayerHit && (a.isPlayer || b.isPlayer)) {
          onPlayerHit();
        }
      }
    }
  }
}

/** Keeps a car within the barrier bounds of the track, bouncing it back if it goes too far off. */
export function resolveTrackBounds(carState, track, onPlayerHit, isPlayer) {
  const dist = track.distanceFromCenter(carState.x, carState.y);
  const hardLimit = track.width / 2 + 34;
  if (dist > hardLimit) {
    const nearestIdx = track.nearestIndex(carState.x, carState.y);
    const p = track.centerline[nearestIdx];
    const dx = carState.x - p.x, dy = carState.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    carState.x = p.x + (dx / len) * hardLimit;
    carState.y = p.y + (dy / len) * hardLimit;
    carState.speed *= 0.4;
    carState.collisionFlash = 0.3;
    if (isPlayer && onPlayerHit) onPlayerHit();
  }
}
