import { Vector2 } from "../utils/vector2";
import { Entity } from "./types";

const DEFAULT_RADIUS = 4;
const DEFAULT_COLOR = "#ffeb3b";

export interface ProjectileConfig {
  readonly speed: number;
  readonly damage: number;
  readonly maxRange: number;
  readonly radius: number;
  readonly color: string;
}

export const DEFAULT_PROJECTILE_CONFIG: ProjectileConfig = {
  speed: 400,
  damage: 10,
  maxRange: 500,
  radius: DEFAULT_RADIUS,
  color: DEFAULT_COLOR,
};

export class Projectile implements Entity {
  position: Vector2 = Vector2.ZERO;
  readonly radius: number = DEFAULT_RADIUS;
  active: boolean = false;

  private origin: Vector2 = Vector2.ZERO;
  private velocity: Vector2 = Vector2.ZERO;
  private _damage: number = 0;
  private maxRange: number = 0;
  private pierceRemaining: number = 0;
  private color: string = DEFAULT_COLOR;

  get damage(): number {
    return this._damage;
  }

  activate(
    origin: Vector2,
    direction: Vector2,
    config: ProjectileConfig,
    pierce: number,
  ): void {
    this.position = origin;
    this.origin = origin;
    this.velocity = direction.normalize().scale(config.speed);
    this._damage = config.damage;
    this.maxRange = config.maxRange;
    this.pierceRemaining = pierce;
    this.color = config.color;
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  update(dt: number): void {
    if (!this.active) return;

    this.position = this.position.add(this.velocity.scale(dt));

    if (this.position.distanceTo(this.origin) >= this.maxRange) {
      this.active = false;
    }
  }

  onHitEnemy(): boolean {
    this.pierceRemaining--;
    if (this.pierceRemaining <= 0) {
      this.active = false;
      return true;
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
