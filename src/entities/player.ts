import { Vector2 } from "../utils/vector2";
import { InputState } from "../systems/input";

const PLAYER_SPEED = 200;
const PLAYER_RADIUS = 16;
const PLAYER_COLOR = "#4fc3f7";
const PLAYER_MAX_HEALTH = 100;
const HEALTH_BAR_WIDTH = 32;
const HEALTH_BAR_HEIGHT = 4;
const HEALTH_BAR_OFFSET_Y = -24;
const HEALTH_BAR_BG_COLOR = "#333";
const HEALTH_BAR_FG_COLOR = "#4caf50";

export class Player {
  position: Vector2;
  readonly radius: number = PLAYER_RADIUS;
  readonly maxHealth: number = PLAYER_MAX_HEALTH;
  health: number = PLAYER_MAX_HEALTH;

  constructor(position: Vector2 = Vector2.ZERO) {
    this.position = position;
  }

  update(dt: number, input: InputState): void {
    let dx = 0;
    let dy = 0;

    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;

    const direction = new Vector2(dx, dy).normalize();
    this.position = this.position.add(direction.scale(PLAYER_SPEED * dt));
  }

  render(ctx: CanvasRenderingContext2D): void {
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
  }
}
