import { Vector2 } from "../utils/vector2";
import { Entity } from "./types";

const HEALTH_BAR_WIDTH = 24;
const HEALTH_BAR_HEIGHT = 3;
const HEALTH_BAR_OFFSET_Y = -16;
const HEALTH_BAR_BG_COLOR = "#333";
const HEALTH_BAR_FG_COLOR = "#ef5350";
const FLASH_DURATION = 0.05;
const KNOCKBACK_STRENGTH = 200;
const KNOCKBACK_DECAY = 0.0001;
const KNOCKBACK_THRESHOLD = 5;

export type EnemyType = "shambler" | "runner" | "tank" | "swarm";

export interface EnemyConfig {
  readonly type: EnemyType;
  readonly speed: number;
  readonly radius: number;
  readonly maxHealth: number;
  readonly color: string;
  readonly damage: number;
  readonly xpValue: number;
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  shambler: {
    type: "shambler",
    speed: 60,
    radius: 12,
    maxHealth: 30,
    color: "#e53935",
    damage: 10,
    xpValue: 3,
  },
  runner: {
    type: "runner",
    speed: 120,
    radius: 8,
    maxHealth: 15,
    color: "#ff9800",
    damage: 5,
    xpValue: 1,
  },
  tank: {
    type: "tank",
    speed: 40,
    radius: 18,
    maxHealth: 100,
    color: "#7b1fa2",
    damage: 20,
    xpValue: 8,
  },
  swarm: {
    type: "swarm",
    speed: 150,
    radius: 5,
    maxHealth: 8,
    color: "#66bb6a",
    damage: 3,
    xpValue: 1,
  },
};

export class Enemy implements Entity {
  position: Vector2;
  readonly radius: number;
  readonly maxHealth: number;
  readonly config: EnemyConfig;
  readonly speed: number;
  health: number;
  active: boolean = true;
  killed: boolean = false;
  flashTimer: number = 0;
  knockbackVelocity: Vector2 = Vector2.ZERO;

  constructor(position: Vector2, config: EnemyConfig, statScale: number = 1) {
    this.position = position;
    this.config = config;
    this.radius = config.radius;
    this.speed = config.speed * statScale;
    this.maxHealth = Math.round(config.maxHealth * statScale);
    this.health = this.maxHealth;
  }

  takeDamage(amount: number, knockbackDir?: Vector2): void {
    if (!this.active) return;
    this.health = Math.max(0, this.health - amount);
    this.flashTimer = FLASH_DURATION;
    if (knockbackDir) {
      this.knockbackVelocity = knockbackDir
        .normalize()
        .scale(KNOCKBACK_STRENGTH);
    }
    if (this.health <= 0) {
      this.active = false;
      this.killed = true;
    }
  }

  update(dt: number, target: Vector2): void {
    if (!this.active) return;

    // Decay flash
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - dt);
    }

    // Apply and decay knockback
    if (this.knockbackVelocity.magnitude() > KNOCKBACK_THRESHOLD) {
      this.position = this.position.add(this.knockbackVelocity.scale(dt));
      const decay = Math.pow(KNOCKBACK_DECAY, dt);
      this.knockbackVelocity = this.knockbackVelocity.scale(decay);
    } else {
      this.knockbackVelocity = Vector2.ZERO;
      // Chase player only when not being knocked back
      const direction = target.subtract(this.position).normalize();
      this.position = this.position.add(direction.scale(this.speed * dt));
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    // Enemy circle — white flash on hit
    ctx.fillStyle = this.flashTimer > 0 ? "#fff" : this.config.color;
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
