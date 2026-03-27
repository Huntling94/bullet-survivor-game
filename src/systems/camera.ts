import { Vector2 } from "../utils/vector2";

export class Camera {
  position: Vector2 = Vector2.ZERO;

  update(target: Vector2, _dt: number): void {
    this.position = target;
  }

  applyTransform(
    ctx: CanvasRenderingContext2D,
    screenWidth: number,
    screenHeight: number,
  ): void {
    ctx.save();
    ctx.translate(
      screenWidth / 2 - this.position.x,
      screenHeight / 2 - this.position.y,
    );
  }

  resetTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }
}
