import { Vector2 } from "../utils/vector2";

const SMOOTH_BASE = 0.0001;

export class Camera {
  position: Vector2 = Vector2.ZERO;
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeTimer: number = 0;

  shake(intensity: number, duration: number): void {
    if (intensity > this.shakeIntensity || this.shakeTimer <= 0) {
      this.shakeIntensity = intensity;
      this.shakeDuration = duration;
      this.shakeTimer = duration;
    }
  }

  update(target: Vector2, dt: number): void {
    const smoothing = 1 - Math.pow(SMOOTH_BASE, dt);
    this.position = this.position.add(
      target.subtract(this.position).scale(smoothing),
    );

    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
      }
    }
  }

  applyTransform(
    ctx: CanvasRenderingContext2D,
    screenWidth: number,
    screenHeight: number,
  ): void {
    ctx.save();
    let offsetX = screenWidth / 2 - this.position.x;
    let offsetY = screenHeight / 2 - this.position.y;

    if (this.shakeTimer > 0) {
      const progress = this.shakeTimer / this.shakeDuration;
      const magnitude = this.shakeIntensity * progress;
      offsetX += (Math.random() * 2 - 1) * magnitude;
      offsetY += (Math.random() * 2 - 1) * magnitude;
    }

    ctx.translate(offsetX, offsetY);
  }

  resetTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }
}
