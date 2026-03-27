import { Player } from "./entities/player";
import { Enemy, ENEMY_CONFIGS } from "./entities/enemy";
import { Camera } from "./systems/camera";
import { InputState } from "./systems/input";
import { Spawner } from "./systems/spawner";
import { checkPlayerEnemyCollisions } from "./systems/collision";

const FPS_UPDATE_INTERVAL = 0.5;
const FPS_FONT = "14px monospace";
const FPS_COLOR = "#0f0";
const HUD_FONT = "14px monospace";
const HUD_COLOR = "#fff";
const FPS_X = 10;
const FPS_Y = 20;
const WAVE_HUD_X = 10;
const WAVE_HUD_Y = 40;

export class Game {
  width: number;
  height: number;
  fps: number = 0;

  readonly player: Player;
  readonly camera: Camera;
  readonly spawner: Spawner;
  enemies: Enemy[] = [];
  private readonly input: InputState;

  private fpsAccumulator: number = 0;
  private fpsFrameCount: number = 0;

  constructor(width: number, height: number, input: InputState) {
    this.width = width;
    this.height = height;
    this.input = input;
    this.player = new Player();
    this.camera = new Camera();
    this.spawner = new Spawner();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  update(dt: number): void {
    this.player.update(dt, this.input);

    // Spawn enemies
    const activeCount = this.enemies.filter((e) => e.active).length;
    const instructions = this.spawner.update(
      dt,
      this.player.position,
      this.width,
      this.height,
      activeCount,
    );
    for (const inst of instructions) {
      this.enemies.push(new Enemy(inst.position, ENEMY_CONFIGS[inst.type]));
    }

    // Update enemies
    for (const enemy of this.enemies) {
      enemy.update(dt, this.player.position);
    }

    // Despawn far enemies
    const despawnRadius = this.spawner.getDespawnRadius(
      this.width,
      this.height,
    );
    for (const enemy of this.enemies) {
      if (
        enemy.active &&
        enemy.position.distanceTo(this.player.position) > despawnRadius
      ) {
        enemy.active = false;
      }
    }

    // Remove inactive enemies from array
    this.enemies = this.enemies.filter((e) => e.active);

    // Collision
    checkPlayerEnemyCollisions(this.player, this.enemies);

    // Camera
    this.camera.update(this.player.position, dt);

    // FPS
    this.fpsAccumulator += dt;
    this.fpsFrameCount++;
    if (this.fpsAccumulator >= FPS_UPDATE_INTERVAL) {
      this.fps = Math.round(this.fpsFrameCount / this.fpsAccumulator);
      this.fpsAccumulator = 0;
      this.fpsFrameCount = 0;
    }
  }

  private renderGrid(ctx: CanvasRenderingContext2D): void {
    const gridSize = 64;
    const color = "#1a1a1a";

    const startX =
      Math.floor((this.camera.position.x - this.width / 2) / gridSize) *
      gridSize;
    const startY =
      Math.floor((this.camera.position.y - this.height / 2) / gridSize) *
      gridSize;
    const endX = startX + this.width + gridSize;
    const endY = startY + this.height + gridSize;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Clear entire screen
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.width, this.height);

    // World space rendering (inside camera transform)
    this.camera.applyTransform(ctx, this.width, this.height);
    this.renderGrid(ctx);
    for (const enemy of this.enemies) {
      enemy.render(ctx);
    }
    this.player.render(ctx);
    this.camera.resetTransform(ctx);

    // Screen space rendering (HUD)
    ctx.fillStyle = FPS_COLOR;
    ctx.font = FPS_FONT;
    ctx.textBaseline = "top";
    ctx.fillText(`FPS: ${this.fps}`, FPS_X, FPS_Y);

    ctx.fillStyle = HUD_COLOR;
    ctx.font = HUD_FONT;
    ctx.fillText(`Wave ${this.spawner.waveNumber}`, WAVE_HUD_X, WAVE_HUD_Y);
  }
}
