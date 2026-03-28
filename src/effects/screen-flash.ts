export class ScreenFlash {
  private color: string = "";
  private duration: number = 0;
  private timer: number = 0;

  get isActive(): boolean {
    return this.timer > 0;
  }

  trigger(color: string, duration: number): void {
    this.color = color;
    this.duration = duration;
    this.timer = duration;
  }

  update(dt: number): void {
    if (this.timer > 0) {
      this.timer = Math.max(0, this.timer - dt);
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.timer <= 0) return;

    const alpha = this.timer / this.duration;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
  }
}
