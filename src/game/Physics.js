// Lightweight arcade physics. Not a simulation - tuned to feel responsive on mobile.
// A "car state" is a plain object: { x, z, heading, speed, driftFactor }

export function createCarState(x, z, heading = 0) {
  return {
    x, z,
    heading,          // radians, 0 = +Z axis
    speed: 0,         // world units / second (forward positive)
    driftAmount: 0,   // 0..1 visual drift intensity
    nitro: 1,         // 0..1 meter
    nitroActive: false,
    offRoad: false,
    collisionFlash: 0 // seconds remaining of collision shake
  };
}

const NITRO_DRAIN_PER_SEC = 0.42;
const NITRO_RECHARGE_PER_SEC = 0.10;

/**
 * Steps a car's physics state forward by dt seconds.
 * @param {object} state - car state (mutated in place)
 * @param {object} input - { throttle: -1..1, steer: -1..1, brake: bool, nitro: bool }
 * @param {object} tuning - physics tuning from CarData
 * @param {number} dt
 * @param {function} offRoadSampler - optional (x,z) => bool, whether point is off the drivable road
 */
export function stepCarPhysics(state, input, tuning, dt, offRoadSampler) {
  const { maxSpeed, accel, brake, turnRate, gripBase, nitroMultiplier } = tuning;

  // Nitro meter
  if (input.nitro && state.nitro > 0.02 && state.speed > 1) {
    state.nitroActive = true;
    state.nitro = Math.max(0, state.nitro - NITRO_DRAIN_PER_SEC * dt);
  } else {
    state.nitroActive = false;
    state.nitro = Math.min(1, state.nitro + NITRO_RECHARGE_PER_SEC * dt);
  }

  const effectiveMax = state.nitroActive ? maxSpeed * nitroMultiplier : maxSpeed;

  // Off-road slowdown
  let offRoad = false;
  if (offRoadSampler) offRoad = offRoadSampler(state.x, state.z);
  state.offRoad = offRoad;
  const surfaceFactor = offRoad ? 0.45 : 1.0;

  // Throttle / brake
  if (input.brake) {
    // Braking / reverse
    state.speed -= brake * dt;
  } else if (input.throttle > 0) {
    const accelForce = state.nitroActive ? accel * nitroMultiplier : accel;
    state.speed += accelForce * surfaceFactor * dt;
  } else {
    // natural engine braking / friction
    state.speed -= (accel * 0.35) * dt;
  }

  state.speed = Math.max(-maxSpeed * 0.4, Math.min(effectiveMax, state.speed));
  if (!input.brake && Math.abs(state.speed) < 0.05) state.speed = 0;

  // Steering - scaled by speed so it doesn't spin in place, more responsive at speed
  const speedFactor = Math.min(1, Math.abs(state.speed) / (maxSpeed * 0.5));
  const steerAmount = input.steer * turnRate * (0.35 + 0.65 * speedFactor) * dt * Math.sign(state.speed || 1);
  state.heading += steerAmount;

  // Drift: braking + steering at speed increases drift factor
  const wantsDrift = input.brake && Math.abs(input.steer) > 0.3 && Math.abs(state.speed) > maxSpeed * 0.3;
  const targetDrift = wantsDrift ? Math.min(1, Math.abs(input.steer)) : 0;
  state.driftAmount += (targetDrift - state.driftAmount) * Math.min(1, dt * 4);

  // Grip affects how directly heading translates to velocity direction (drift = less grip)
  const grip = gripBase * (1 - state.driftAmount * 0.5) * surfaceFactor;
  const moveHeading = state.heading; // simplified: velocity follows heading, drift affects visual/friction only
  void grip; // grip currently expressed through friction/drift feel; reserved for future tuning

  const dx = Math.sin(moveHeading) * state.speed * dt;
  const dz = Math.cos(moveHeading) * state.speed * dt;
  state.x += dx;
  state.z += dz;

  if (state.collisionFlash > 0) state.collisionFlash = Math.max(0, state.collisionFlash - dt);

  return state;
}

export function applyCollisionImpulse(state, awayX, awayZ, strength = 6) {
  const len = Math.hypot(awayX, awayZ) || 1;
  state.x += (awayX / len) * strength * 0.05;
  state.z += (awayZ / len) * strength * 0.05;
  state.speed *= 0.55;
  state.collisionFlash = 0.35;
}
