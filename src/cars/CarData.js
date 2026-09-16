// All cars are original, fictional designs - names, colors and stats only.
// Stats are 0-1 sliders used both for the garage UI bars and for tuning physics.
export const CARS = [
  {
    id: 'velocity-x',
    name: 'VELOCITY-X',
    color: 0x00e6ff,
    accentColor: 0xff00c8,
    stats: { speed: 0.7, accel: 0.75, handling: 0.7, nitro: 0.7 },
    physics: { maxSpeed: 62, accel: 26, brake: 40, turnRate: 2.6, gripBase: 6.0, nitroMultiplier: 1.5 },
    price: 0
  },
  {
    id: 'photon-gt',
    name: 'PHOTON GT',
    color: 0xff00c8,
    accentColor: 0x00e6ff,
    stats: { speed: 0.85, accel: 0.6, handling: 0.55, nitro: 0.8 },
    physics: { maxSpeed: 70, accel: 22, brake: 36, turnRate: 2.2, gripBase: 5.2, nitroMultiplier: 1.6 },
    price: 1500
  },
  {
    id: 'aero-drift',
    name: 'AERO DRIFT',
    color: 0xffd400,
    accentColor: 0x111111,
    stats: { speed: 0.6, accel: 0.65, handling: 0.9, nitro: 0.6 },
    physics: { maxSpeed: 56, accel: 24, brake: 44, turnRate: 3.2, gripBase: 7.2, nitroMultiplier: 1.4 },
    price: 2500
  }
];

export function getCarById(id) {
  return CARS.find(c => c.id === id) || CARS[0];
}
