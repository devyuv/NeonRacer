// Generic 2D track builder: turns a list of {x,y} control points into a smooth
// closed loop (centerline), a filled road polygon, and barrier positions - plus
// fast helpers for off-road detection and lap progress. No external libraries.

const ROAD_WIDTH = 90;
const SAMPLES_PER_SEGMENT = 14;

function catmullRomPoint(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
  const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
  return { x, y };
}

function buildClosedSpline(points, samplesPerSegment) {
  const n = points.length;
  const result = [];
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    for (let s = 0; s < samplesPerSegment; s++) {
      result.push(catmullRomPoint(p0, p1, p2, p3, s / samplesPerSegment));
    }
  }
  return result;
}

export class TrackBuilder {
  constructor(controlPoints, options = {}) {
    this.options = {
      roadColor: options.roadColor ?? '#14141f',
      lineColor: options.lineColor ?? '#00e6ff',
      barrierColor: options.barrierColor ?? '#ff00c8',
      width: options.width ?? ROAD_WIDTH,
      ...options
    };
    this.width = this.options.width;

    this.centerline = buildClosedSpline(controlPoints, SAMPLES_PER_SEGMENT);
    this.length = this._estimateLength(this.centerline);

    this._buildRoadPolygon();
    this._buildBarrierPoints();
    this.startPoint = { x: this.centerline[0].x, y: this.centerline[0].y };
    const p0 = this.centerline[0], p1 = this.centerline[1];
    this.startHeading = Math.atan2(p1.x - p0.x, -(p1.y - p0.y));
  }

  _estimateLength(points) {
    let len = 0;
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      len += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return len;
  }

  frameAt(i) {
    const n = this.centerline.length;
    const p = this.centerline[i];
    const pNext = this.centerline[(i + 1) % n];
    const dx = pNext.x - p.x, dy = pNext.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const dirX = dx / len, dirY = dy / len;
    // perpendicular (rotate direction 90deg)
    const normX = -dirY, normY = dirX;
    return { p, dirX, dirY, normX, normY };
  }

  _buildRoadPolygon() {
    const halfW = this.width / 2;
    this.leftEdge = [];
    this.rightEdge = [];
    for (let i = 0; i < this.centerline.length; i++) {
      const { p, normX, normY } = this.frameAt(i);
      this.leftEdge.push({ x: p.x + normX * halfW, y: p.y + normY * halfW });
      this.rightEdge.push({ x: p.x - normX * halfW, y: p.y - normY * halfW });
    }
  }

  _buildBarrierPoints() {
    const halfW = this.width / 2 + 14;
    this.barriers = { left: [], right: [] };
    for (let i = 0; i < this.centerline.length; i += 2) {
      const { p, normX, normY } = this.frameAt(i);
      this.barriers.left.push({ x: p.x + normX * halfW, y: p.y + normY * halfW });
      this.barriers.right.push({ x: p.x - normX * halfW, y: p.y - normY * halfW });
    }
  }

  /** Draws the road surface, lane markings, edge glow and barriers onto a 2D context (world space). */
  draw(ctx) {
    // Road surface
    ctx.fillStyle = this.options.roadColor;
    ctx.beginPath();
    ctx.moveTo(this.leftEdge[0].x, this.leftEdge[0].y);
    for (let i = 1; i < this.leftEdge.length; i++) ctx.lineTo(this.leftEdge[i].x, this.leftEdge[i].y);
    for (let i = this.rightEdge.length - 1; i >= 0; i--) ctx.lineTo(this.rightEdge[i].x, this.rightEdge[i].y);
    ctx.closePath();
    ctx.fill();

    // Edge glow lines
    ctx.strokeStyle = this.options.lineColor;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;
    [this.leftEdge, this.rightEdge].forEach(edge => {
      ctx.beginPath();
      ctx.moveTo(edge[0].x, edge[0].y);
      for (let i = 1; i < edge.length; i++) ctx.lineTo(edge[i].x, edge[i].y);
      ctx.closePath();
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // Dashed center line
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 12]);
    ctx.beginPath();
    ctx.moveTo(this.centerline[0].x, this.centerline[0].y);
    for (let i = 1; i < this.centerline.length; i++) ctx.lineTo(this.centerline[i].x, this.centerline[i].y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // Barriers
    ctx.fillStyle = this.options.barrierColor;
    [this.barriers.left, this.barriers.right].forEach(edge => {
      edge.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Start/finish line
    const startFrame = this.frameAt(0);
    ctx.save();
    ctx.translate(startFrame.p.x, startFrame.p.y);
    ctx.rotate(Math.atan2(startFrame.dirY, startFrame.dirX));
    ctx.fillStyle = '#ffffff';
    const checkerCount = 6;
    const cw = this.width / checkerCount;
    for (let i = 0; i < checkerCount; i++) {
      if (i % 2 === 0) ctx.fillRect(-this.width / 2 + i * cw, -4, cw, 8);
    }
    ctx.restore();
  }

  distanceFromCenter(x, y, searchIndexHint = -1) {
    let best = Infinity;
    const n = this.centerline.length;
    let start = 0, end = n;
    if (searchIndexHint >= 0) {
      start = Math.max(0, searchIndexHint - 12);
      end = Math.min(n, searchIndexHint + 12);
    }
    for (let i = start; i < end; i++) {
      const p = this.centerline[i];
      const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }

  isOffRoad(x, y, indexHint = -1) {
    return this.distanceFromCenter(x, y, indexHint) > this.width / 2 + 4;
  }

  nearestIndex(x, y) {
    let best = Infinity, bestI = 0;
    for (let i = 0; i < this.centerline.length; i++) {
      const p = this.centerline[i];
      const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
      if (d < best) { best = d; bestI = i; }
    }
    return bestI;
  }
}
