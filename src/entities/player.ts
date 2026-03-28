import { Vector2 } from "../utils/vector2";
import { InputState } from "../systems/input";
import { Entity } from "./types";

const DEFAULT_SPEED = 200;
const PLAYER_RADIUS = 16;
const PLAYER_COLOR = "#4fc3f7";
const DEFAULT_MAX_HEALTH = 100;
const DEFAULT_PICKUP_RADIUS = 100;
const HEALTH_BAR_WIDTH = 32;
const HEALTH_BAR_HEIGHT = 4;
const HEALTH_BAR_OFFSET_Y = -24;
const HEALTH_BAR_BG_COLOR = "#333";
const HEALTH_BAR_FG_COLOR = "#4caf50";
const INVINCIBILITY_DURATION = 1.0;
const FLICKER_RATE = 10;

export class Player implements Entity {
  position: Vector2;
  readonly radius: number = PLAYER_RADIUS;
  maxHealth: number = DEFAULT_MAX_HEALTH;
  health: number = DEFAULT_MAX_HEALTH;
  speed: number = DEFAULT_SPEED;
  pickupRadius: number = DEFAULT_PICKUP_RADIUS;
  active: boolean = true;
  invincibilityTimer: number = 0;

  constructor(position: Vector2 = Vector2.ZERO) {
    this.position = position;
  }

  reset(): void {
    this.position = Vector2.ZERO;
    this.health = DEFAULT_MAX_HEALTH;
    this.maxHealth = DEFAULT_MAX_HEALTH;
    this.speed = DEFAULT_SPEED;
    this.pickupRadius = DEFAULT_PICKUP_RADIUS;
    this.invincibilityTimer = 0;
    this.active = true;
  }

  get isInvincible(): boolean {
    return this.invincibilityTimer > 0;
  }

  takeDamage(amount: number): void {
    if (this.isInvincible) return;
    this.health = Math.max(0, this.health - amount);
    this.invincibilityTimer = INVINCIBILITY_DURATION;
  }

  update(dt: number, input: InputState): void {
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer = Math.max(0, this.invincibilityTimer - dt);
    }

    let dx = 0;
    let dy = 0;

    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;

    const direction = new Vector2(dx, dy).normalize();
    this.position = this.position.add(direction.scale(this.speed * dt));
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Flicker during invincibility
    if (this.isInvincible) {
      const flicker = Math.sin(
        this.invincibilityTimer * FLICKER_RATE * Math.PI * 2,
      );
      ctx.globalAlpha = flicker > 0 ? 1.0 : 0.3;
    }

    // Player circle
    ctx.fillStyle = PLAYER_COLOR;
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

    // Reset alpha
    if (this.isInvincible) {
      ctx.globalAlpha = 1.0;
    }
  }
}
