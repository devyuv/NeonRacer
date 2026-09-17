// Simple 2D top-down follow camera: smoothly centers on the player's world
// position, with a mild zoom-out at speed and a short shake on collisions.
export class FollowCamera2D {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this._initialized = false;
    this.shakeTime = 0;
    this.shakeStrength = 0;
  }

  triggerShake(strength = 6, duration = 0.3) {
    this.shakeStrength = Math.max(this.shakeStrength, strength);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  update(dt, targetX, targetY, speedRatio) {
    if (!this._initialized) {
      this.x = targetX;
      this.y = targetY;
      this._initialized = true;
    } else {
      const followSpeed = Math.min(1, dt * 6);
      this.x += (targetX - this.x) * followSpeed;
      this.y += (targetY - this.y) * followSpeed;
    }

    const targetZoom = 1.05 - Math.min(1, speedRatio) * 0.18;
    this.zoom += (targetZoom - this.zoom) * Math.min(1, dt * 3);

    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const t = Math.max(0, this.shakeTime);
      const s = this.shakeStrength * t;
      this.shakeOffsetX = (Math.random() - 0.5) * s;
      this.shakeOffsetY = (Math.random() - 0.5) * s;
      if (this.shakeTime <= 0) this.shakeStrength = 0;
    }
  }

  /** Applies this camera's transform to a 2D context. Call ctx.save() before and ctx.restore() after. */
  apply(ctx, canvasWidth, canvasHeight) {
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x + this.shakeOffsetX, -this.y + this.shakeOffsetY);
  }

  /** World-space view bounds currently visible, with margin - used to cull decorations. */
  getViewBounds(canvasWidth, canvasHeight, margin = 150) {
    const halfW = (canvasWidth / 2) / this.zoom + margin;
    const halfH = (canvasHeight / 2) / this.zoom + margin;
    return {
      left: this.x - halfW, right: this.x + halfW,
      top: this.y - halfH, bottom: this.y + halfH,
      width: halfW * 2, height: halfH * 2
    };
  }
}
