import { Player } from "./entities/player";
import { Camera } from "./systems/camera";
import { InputState } from "./systems/input";

const FPS_UPDATE_INTERVAL = 0.5;
const FPS_FONT = "14px monospace";
const FPS_COLOR = "#0f0";
const FPS_X = 10;
const FPS_Y = 20;

export class Game {
  width: number;
  height: number;
  fps: number = 0;

  readonly player: Player;
  readonly camera: Camera;
  private readonly input: InputState;

  private fpsAccumulator: number = 0;
  private fpsFrameCount: number = 0;

  constructor(width: number, height: number, input: InputState) {
    this.width = width;
    this.height = height;
    this.input = input;
    this.player = new Player();
    this.camera = new Camera();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  update(dt: number): void {
    this.player.update(dt, this.input);
    this.camera.update(this.player.position, dt);

    this.fpsAccumulator += dt;
    this.fpsFrameCount++;

    if (this.fpsAccumulator >= FPS_UPDATE_INTERVAL) {
      this.fps = Math.round(this.fpsFrameCount / this.fpsAccumulator);
      this.fpsAccumulator = 0;
      this.fpsFrameCount = 0;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Clear entire screen
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.width, this.height);

    // World space rendering (inside camera transform)
    this.camera.applyTransform(ctx, this.width, this.height);
    this.player.render(ctx);
    this.camera.resetTransform(ctx);

    // Screen space rendering (HUD)
    ctx.fillStyle = FPS_COLOR;
    ctx.font = FPS_FONT;
    ctx.textBaseline = "top";
    ctx.fillText(`FPS: ${this.fps}`, FPS_X, FPS_Y);
  }
}
