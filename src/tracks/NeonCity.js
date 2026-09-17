import { TrackBuilder } from './TrackManager.js';

// Original circuit layout - a flowing loop. Coordinates only, no reference to any
// real or copyrighted location. Units are world pixels.
const CONTROL_POINTS = [
  { x: 0, y: 0 },
  { x: 500, y: 80 },
  { x: 820, y: 340 },
  { x: 820, y: 760 },
  { x: 480, y: 980 },
  { x: -120, y: 980 },
  { x: -420, y: 760 },
  { x: -420, y: 420 },
  { x: -160, y: 260 },
  { x: -160, y: 60 }
];

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildNeonCity(graphicsTier = 'medium') {
  const track = new TrackBuilder(CONTROL_POINTS, {
    roadColor: '#14141f',
    lineColor: '#00e6ff',
    barrierColor: '#ff00c8',
    width: 100
  });

  const rand = mulberry32(1337);
  const density = graphicsTier === 'low' ? 0.35 : graphicsTier === 'medium' ? 0.7 : 1.0;

  const buildings = [];
  const buildingCount = Math.floor(90 * density);
  for (let i = 0; i < buildingCount; i++) {
    const idx = Math.floor(rand() * track.centerline.length);
    const { p, normX, normY } = track.frameAt(idx);
    const side = rand() > 0.5 ? 1 : -1;
    const dist = 90 + rand() * 220;
    const w = 40 + rand() * 60;
    const h = 40 + rand() * 60;
    buildings.push({
      x: p.x + normX * side * dist - w / 2,
      y: p.y + normY * side * dist - h / 2,
      w, h,
      color: rand() > 0.5 ? '#151a2c' : '#171225',
      neon: rand() > 0.45,
      neonColor: rand() > 0.5 ? '#00e6ff' : '#ff00c8'
    });
  }

  const trees = [];
  const treeCount = Math.floor(70 * density);
  for (let i = 0; i < treeCount; i++) {
    const idx = Math.floor(rand() * track.centerline.length);
    const { p, normX, normY } = track.frameAt(idx);
    const side = rand() > 0.5 ? 1 : -1;
    const dist = 70 + rand() * 100;
    trees.push({ x: p.x + normX * side * dist, y: p.y + normY * side * dist, r: 10 + rand() * 8 });
  }

  const lights = [];
  const lightStep = graphicsTier === 'high' ? 6 : graphicsTier === 'medium' ? 10 : 18;
  for (let i = 0; i < track.centerline.length; i += lightStep) {
    const { p, normX, normY } = track.frameAt(i);
    const side = (i % (lightStep * 2) === 0) ? 1 : -1;
    const dist = track.width / 2 + 30;
    lights.push({ x: p.x + normX * side * dist, y: p.y + normY * side * dist });
  }

  return {
    id: 'neon-city',
    name: 'Neon City',
    track,
    laps: 3,
    backgroundColor: '#0a0a14',
    draw(ctx, viewBounds) {
      // Grass/ground fill beyond the road
      ctx.fillStyle = '#0e1420';
      ctx.fillRect(viewBounds.left, viewBounds.top, viewBounds.width, viewBounds.height);

      // Decorative buildings (skip ones clearly outside the current view for performance)
      buildings.forEach(b => {
        if (b.x + b.w < viewBounds.left || b.x > viewBounds.right || b.y + b.h < viewBounds.top || b.y > viewBounds.bottom) return;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        if (b.neon) {
          ctx.fillStyle = b.neonColor;
          ctx.globalAlpha = 0.85;
          ctx.fillRect(b.x + 4, b.y + 4, b.w - 8, 4);
          ctx.globalAlpha = 1;
        }
      });

      // Trees
      ctx.fillStyle = '#123524';
      trees.forEach(t => {
        if (t.x + t.r < viewBounds.left || t.x - t.r > viewBounds.right || t.y + t.r < viewBounds.top || t.y - t.r > viewBounds.bottom) return;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Street lights
      lights.forEach(l => {
        if (l.x < viewBounds.left - 20 || l.x > viewBounds.right + 20 || l.y < viewBounds.top - 20 || l.y > viewBounds.bottom + 20) return;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 242, 192, 0.9)';
        ctx.arc(l.x, l.y, 4, 0, Math.PI * 2);
        ctx.fill();
        if (graphicsTier !== 'low') {
          const grad = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, 26);
          grad.addColorStop(0, 'rgba(255,242,192,0.25)');
          grad.addColorStop(1, 'rgba(255,242,192,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(l.x, l.y, 26, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Track itself
      track.draw(ctx);
    }
  };
}
