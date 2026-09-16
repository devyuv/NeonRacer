import { buildNeonCity } from './NeonCity.js';

// Desert Rush and Mountain Circuit are architected here but not yet fully modeled -
// TrackManager/TrackBuilder already supports any control-point loop, so adding them
// later just means writing a new file like NeonCity.js with different control points
// and decorations, then registering it below.
export const TRACK_LIST = [
  {
    id: 'neon-city',
    name: 'Neon City',
    description: 'A glowing downtown circuit lined with skyscrapers and neon signs.',
    implemented: true,
    laps: 3
  },
  {
    id: 'desert-rush',
    name: 'Desert Rush',
    description: 'Coming soon - sun-scorched canyons and long straights.',
    implemented: false,
    laps: 3
  },
  {
    id: 'mountain-circuit',
    name: 'Mountain Circuit',
    description: 'Coming soon - switchbacks through misty peaks.',
    implemented: false,
    laps: 3
  }
];

export function buildTrack(trackId, graphicsTier) {
  switch (trackId) {
    case 'neon-city':
    default:
      return buildNeonCity(graphicsTier);
  }
}
