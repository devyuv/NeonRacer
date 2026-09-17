// Draws an original, simple top-down car sprite using Canvas 2D primitives only -
// no external images, no copyrighted designs. Assumes the canvas context is already
// translated to the car's position and rotated by its heading; the car is drawn
// centered at the origin, pointing "up" (-Y) as forward.

const LENGTH = 34;
const WIDTH = 18;

export function drawCar(ctx, carDef, { braking = false, nitroActive = false, driftAmount = 0 } = {}) {
  const halfL = LENGTH / 2;
  const halfW = WIDTH / 2;

  ctx.save();

  // Slight drift skew for visual feel
  if (driftAmount > 0.05) {
    ctx.rotate(driftAmount * 0.18);
  }

  // Nitro exhaust flame (drawn first, behind the car)
  if (nitroActive) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    const flameLen = 16 + Math.random() * 10;
    const grad = ctx.createLinearGradient(0, halfL, 0, halfL + flameLen);
    grad.addColorStop(0, '#ffd400');
    grad.addColorStop(1, 'rgba(255,0,200,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-5, halfL);
    ctx.lineTo(5, halfL);
    ctx.lineTo(0, halfL + flameLen);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Shadow
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(2, 3, halfW + 2, halfL, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Wheels (small dark rects at the four corners)
  ctx.fillStyle = '#111114';
  const wheelW = 4, wheelL = 9;
  [[-halfW - 1, -halfL + 8], [halfW - 3, -halfL + 8], [-halfW - 1, halfL - 12], [halfW - 3, halfL - 12]].forEach(([wx, wy]) => {
    ctx.fillRect(wx, wy, wheelW, wheelL);
  });

  // Body
  const bodyColor = '#' + carDef.color.toString(16).padStart(6, '0');
  const accentColor = '#' + carDef.accentColor.toString(16).padStart(6, '0');
  ctx.fillStyle = bodyColor;
  roundRect(ctx, -halfW, -halfL, WIDTH, LENGTH, 6);
  ctx.fill();

  // Accent center stripe
  ctx.fillStyle = accentColor;
  ctx.fillRect(-2, -halfL + 2, 4, LENGTH - 4);

  // Cockpit / windshield
  ctx.fillStyle = 'rgba(15, 22, 32, 0.85)';
  roundRect(ctx, -halfW + 3, -halfL * 0.15, WIDTH - 6, halfL * 0.75, 4);
  ctx.fill();

  // Headlights (front = -Y)
  ctx.fillStyle = '#fffef0';
  ctx.shadowColor = '#fffef0';
  ctx.shadowBlur = 6;
  ctx.fillRect(-halfW + 1, -halfL + 1, 4, 3);
  ctx.fillRect(halfW - 5, -halfL + 1, 4, 3);
  ctx.shadowBlur = 0;

  // Brake lights (rear = +Y)
  ctx.fillStyle = braking ? '#ff2233' : '#7a1420';
  if (braking) { ctx.shadowColor = '#ff2233'; ctx.shadowBlur = 8; }
  ctx.fillRect(-halfW + 1, halfL - 4, 4, 3);
  ctx.fillRect(halfW - 5, halfL - 4, 4, 3);
  ctx.shadowBlur = 0;

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const CAR_LENGTH = LENGTH;
export const CAR_WIDTH = WIDTH;
