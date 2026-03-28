import { Vector2 } from "../utils/vector2";
import { Entity } from "./types";

const HEALTH_BAR_WIDTH = 24;
const HEALTH_BAR_HEIGHT = 3;
const HEALTH_BAR_OFFSET_Y = -16;
const HEALTH_BAR_BG_COLOR = "#333";
const HEALTH_BAR_FG_COLOR = "#ef5350";

export type EnemyType = "shambler" | "runner";

export interface EnemyConfig {
  readonly type: EnemyType;
  readonly speed: number;
  readonly radius: number;
  readonly maxHealth: number;
  readonly color: string;
  readonly damage: number;
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  shambler: {
    type: "shambler",
    speed: 60,
    radius: 12,
    maxHealth: 30,
    color: "#e53935",
    damage: 10,
  },
  runner: {
    type: "runner",
    speed: 120,
    radius: 8,
    maxHealth: 15,
    color: "#ff9800",
    damage: 5,
  },
};

export class Enemy implements Entity {
  position: Vector2;
  readonly radius: number;
  readonly maxHealth: number;
  readonly config: EnemyConfig;
  health: number;
  active: boolean = true;

  constructor(position: Vector2, config: EnemyConfig) {
    this.position = position;
    this.config = config;
    this.radius = config.radius;
    this.maxHealth = config.maxHealth;
    this.health = config.maxHealth;
  }

  takeDamage(amount: number): void {
    if (!this.active) return;
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.active = false;
    }
  }

  update(dt: number, target: Vector2): void {
    if (!this.active) return;

    const direction = target.subtract(this.position).normalize();
    this.position = this.position.add(direction.scale(this.config.speed * dt));
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    // Enemy circle
    ctx.fillStyle = this.config.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Health bar background
    const barX = this.position.x - HEALTH_BAR_WIDTH / 2;
    const barY = this.position.y + HEALTH_BAR_OFFSET_Y;
    ctx.fillStyle = HEALTH_BAR_BG_COLOR;
    ctx.fillRect(barX, barY, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);

    // Health bar foreground
    const healthRatio = this.health / this.maxHealth;
    ctx.fillStyle = HEALTH_BAR_FG_COLOR;
    ctx.fillRect(barX, barY, HEALTH_BAR_WIDTH * healthRatio, HEALTH_BAR_HEIGHT);
  }
}
