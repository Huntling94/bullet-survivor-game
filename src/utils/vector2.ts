export class Vector2 {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static readonly ZERO = new Vector2(0, 0);

  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  subtract(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): Vector2 {
    const mag = this.magnitude();
    if (mag === 0) return Vector2.ZERO;
    return new Vector2(this.x / mag, this.y / mag);
  }

  distanceTo(other: Vector2): number {
    return this.subtract(other).magnitude();
  }

  dot(other: Vector2): number {
    return this.x * other.x + this.y * other.y;
  }

  equals(other: Vector2): boolean {
    return this.x === other.x && this.y === other.y;
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  toString(): string {
    return `Vector2(${this.x}, ${this.y})`;
  }
}
