import { Vector2 } from "../utils/vector2";
import { ObjectPool } from "../utils/object-pool";

export interface ParticleConfig {
  readonly speedMin: number;
  readonly speedMax: number;
  readonly sizeMin: number;
  readonly sizeMax: number;
  readonly lifetime: number;
  readonly color: string;
}

export const DEATH_BURST_CONFIG: ParticleConfig = {
  speedMin: 80,
  speedMax: 200,
  sizeMin: 2,
  sizeMax: 5,
  lifetime: 0.4,
  color: "#e53935",
};

export const HIT_SPARK_CONFIG: ParticleConfig = {
  speedMin: 50,
  speedMax: 150,
  sizeMin: 1,
  sizeMax: 3,
  lifetime: 0.15,
  color: "#fff",
};

const INITIAL_POOL_SIZE = 100;

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export class Particle {
  position: Vector2 = Vector2.ZERO;
  velocity: Vector2 = Vector2.ZERO;
  lifetime: number = 0;
  maxLifetime: number = 0;
  size: number = 0;
  color: string = "#fff";
  active: boolean = false;

  get alpha(): number {
    if (this.maxLifetime <= 0) return 0;
    return this.lifetime / this.maxLifetime;
  }

  activate(
    position: Vector2,
    velocity: Vector2,
    size: number,
    color: string,
    lifetime: number,
  ): void {
    this.position = position;
    this.velocity = velocity;
    this.size = size;
    this.color = color;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  update(dt: number): void {
    if (!this.active) return;
    this.position = this.position.add(this.velocity.scale(dt));
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export class ParticleSystem {
  private pool: ObjectPool<Particle>;

  constructor() {
    this.pool = new ObjectPool<Particle>(
      () => new Particle(),
      (p) => p.deactivate(),
      INITIAL_POOL_SIZE,
    );
  }

  burst(position: Vector2, count: number, config: ParticleConfig): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomRange(config.speedMin, config.speedMax);
      const velocity = new Vector2(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
      );
      const size = randomRange(config.sizeMin, config.sizeMax);
      const particle = this.pool.acquire();
      particle.activate(
        position,
        velocity,
        size,
        config.color,
        config.lifetime,
      );
    }
  }

  update(dt: number): void {
    for (const particle of [...this.pool.getActive()]) {
      particle.update(dt);
      if (!particle.active) {
        this.pool.release(particle);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.pool.getActive()) {
      particle.render(ctx);
    }
  }

  get activeCount(): number {
    return this.pool.activeLength;
  }
}
