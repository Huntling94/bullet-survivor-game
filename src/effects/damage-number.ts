import { Vector2 } from "../utils/vector2";
import { ObjectPool } from "../utils/object-pool";

const FLOAT_SPEED = 60;
const LIFETIME = 0.6;
const NORMAL_COLOR = "#fff";
const KILL_COLOR = "#ffeb3b";
const FONT = "bold 14px monospace";
const KILL_FONT = "bold 18px monospace";
const INITIAL_POOL_SIZE = 30;

export class DamageNumber {
  position: Vector2 = Vector2.ZERO;
  text: string = "";
  lifetime: number = 0;
  maxLifetime: number = 0;
  color: string = NORMAL_COLOR;
  font: string = FONT;
  active: boolean = false;

  get alpha(): number {
    if (this.maxLifetime <= 0) return 0;
    return this.lifetime / this.maxLifetime;
  }

  activate(position: Vector2, amount: number, isKill: boolean): void {
    this.position = position;
    this.text = String(amount);
    this.lifetime = LIFETIME;
    this.maxLifetime = LIFETIME;
    this.color = isKill ? KILL_COLOR : NORMAL_COLOR;
    this.font = isKill ? KILL_FONT : FONT;
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  update(dt: number): void {
    if (!this.active) return;
    this.position = this.position.add(new Vector2(0, -FLOAT_SPEED * dt));
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.font = this.font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.text, this.position.x, this.position.y);
    ctx.textAlign = "start";
    ctx.globalAlpha = 1;
  }
}

export class DamageNumberSystem {
  private pool: ObjectPool<DamageNumber>;

  constructor() {
    this.pool = new ObjectPool<DamageNumber>(
      () => new DamageNumber(),
      (d) => d.deactivate(),
      INITIAL_POOL_SIZE,
    );
  }

  spawn(position: Vector2, amount: number, isKill: boolean): void {
    const dn = this.pool.acquire();
    dn.activate(position, amount, isKill);
  }

  update(dt: number): void {
    for (const dn of [...this.pool.getActive()]) {
      dn.update(dt);
      if (!dn.active) {
        this.pool.release(dn);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const dn of this.pool.getActive()) {
      dn.render(ctx);
    }
  }

  get activeCount(): number {
    return this.pool.activeLength;
  }

  clear(): void {
    this.pool.clear();
  }
}
