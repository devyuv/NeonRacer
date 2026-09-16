import { applyCollisionImpulse } from './Physics.js';

const CAR_RADIUS = 1.3;

/** Resolves simple circle-circle collisions between all provided car states. */
export function resolveCarCollisions(cars, onPlayerHit) {
  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i], b = cars[j];
      const dx = b.state.x - a.state.x;
      const dz = b.state.z - a.state.z;
      const dist = Math.hypot(dx, dz);
      const minDist = CAR_RADIUS * 2;
      if (dist < minDist && dist > 0.001) {
        const overlap = (minDist - dist) / 2;
        const nx = dx / dist, nz = dz / dist;
        a.state.x -= nx * overlap;
        a.state.z -= nz * overlap;
        b.state.x += nx * overlap;
        b.state.z += nz * overlap;

        applyCollisionImpulse(a.state, -nx, -nz, 4);
        applyCollisionImpulse(b.state, nx, nz, 4);

        if (onPlayerHit && (a.isPlayer || b.isPlayer)) {
          onPlayerHit();
        }
      }
    }
  }
}

/** Keeps a car within the barrier bounds of the track, bouncing it back if it goes too far off. */
export function resolveTrackBounds(carState, track, onPlayerHit, isPlayer) {
  const idx = track.nearestIndex ? null : null; // reserved for future optimization
  void idx;
  const dist = track.distanceFromCenter(carState.x, carState.z);
  const hardLimit = track.options.width / 2 + 6;
  if (dist > hardLimit) {
    // Push back toward the nearest centerline point
    const nearestIdx = track.nearestIndex(carState.x, carState.z);
    const p = track.centerline[nearestIdx];
    const dx = carState.x - p.x, dz = carState.z - p.z;
    const len = Math.hypot(dx, dz) || 1;
    const clampedDist = hardLimit;
    carState.x = p.x + (dx / len) * clampedDist;
    carState.z = p.z + (dz / len) * clampedDist;
    carState.speed *= 0.4;
    carState.collisionFlash = 0.3;
    if (isPlayer && onPlayerHit) onPlayerHit();
  }
}
