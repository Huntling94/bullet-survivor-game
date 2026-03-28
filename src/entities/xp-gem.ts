import { Vector2 } from "../utils/vector2";
import { Entity } from "./types";

const COLLECT_RADIUS = 24;
const MAGNET_SPEED = 300;

const GEM_STYLES: { maxXp: number; radius: number; color: string }[] = [
  { maxXp: 1, radius: 4, color: "#4caf50" },
  { maxXp: 5, radius: 6, color: "#42a5f5" },
  { maxXp: Infinity, radius: 8, color: "#ab47bc" },
];

function getGemStyle(xpValue: number): { radius: number; color: string } {
  for (const style of GEM_STYLES) {
    if (xpValue <= style.maxXp) {
      return style;
    }
  }
  return GEM_STYLES[GEM_STYLES.length - 1] as {
    radius: number;
    color: string;
  };
}

export class XpGem implements Entity {
  position: Vector2 = Vector2.ZERO;
  radius: number = 4;
  active: boolean = false;
  xpValue: number = 0;
  private color: string = "#4caf50";

  activate(position: Vector2, xpValue: number): void {
    this.position = position;
    this.xpValue = xpValue;
    this.active = true;
    const style = getGemStyle(xpValue);
    this.radius = style.radius;
    this.color = style.color;
  }

  deactivate(): void {
    this.active = false;
  }

  update(dt: number, playerPos: Vector2, magnetRadius: number): boolean {
    if (!this.active) return false;

    const dist = this.position.distanceTo(playerPos);

    if (dist < COLLECT_RADIUS) {
      return true;
    }

    if (dist < magnetRadius && dist > 0) {
      const direction = playerPos.subtract(this.position).normalize();
      const pullStrength = MAGNET_SPEED * (magnetRadius / dist);
      this.position = this.position.add(direction.scale(pullStrength * dt));
    }

    return false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
