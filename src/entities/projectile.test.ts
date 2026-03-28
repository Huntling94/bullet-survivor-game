import { describe, it, expect, vi } from "vitest";
import { Projectile, DEFAULT_PROJECTILE_CONFIG } from "./projectile";
import { Vector2 } from "../utils/vector2";

function mockCtx(): CanvasRenderingContext2D {
  return {
    fillStyle: "",
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("Projectile", () => {
  it("starts inactive", () => {
    const p = new Projectile();
    expect(p.active).toBe(false);
  });

  it("activate sets position, velocity, and active", () => {
    const p = new Projectile();
    p.activate(
      new Vector2(10, 20),
      new Vector2(1, 0),
      DEFAULT_PROJECTILE_CONFIG,
      1,
    );
    expect(p.active).toBe(true);
    expect(p.position.x).toBe(10);
    expect(p.position.y).toBe(20);
    expect(p.damage).toBe(10);
  });

  it("moves along velocity", () => {
    const p = new Projectile();
    p.activate(Vector2.ZERO, new Vector2(1, 0), DEFAULT_PROJECTILE_CONFIG, 1);
    p.update(1);
    expect(p.position.x).toBeCloseTo(400); // speed = 400
    expect(p.position.y).toBeCloseTo(0);
  });

  it("deactivates at max range", () => {
    const p = new Projectile();
    p.activate(Vector2.ZERO, new Vector2(1, 0), DEFAULT_PROJECTILE_CONFIG, 1);
    // maxRange = 500, speed = 400. After 1.3s: 520px > 500px
    p.update(1.3);
    expect(p.active).toBe(false);
  });

  it("stays active within range", () => {
    const p = new Projectile();
    p.activate(Vector2.ZERO, new Vector2(1, 0), DEFAULT_PROJECTILE_CONFIG, 1);
    p.update(0.5); // 200px < 500px
    expect(p.active).toBe(true);
  });

  it("does not update when inactive", () => {
    const p = new Projectile();
    p.activate(Vector2.ZERO, new Vector2(1, 0), DEFAULT_PROJECTILE_CONFIG, 1);
    p.deactivate();
    p.update(1);
    expect(p.position.equals(Vector2.ZERO)).toBe(true);
  });

  it("onHitEnemy deactivates with pierce 1", () => {
    const p = new Projectile();
    p.activate(Vector2.ZERO, new Vector2(1, 0), DEFAULT_PROJECTILE_CONFIG, 1);
    const shouldDeactivate = p.onHitEnemy();
    expect(shouldDeactivate).toBe(true);
    expect(p.active).toBe(false);
  });

  it("onHitEnemy keeps active with pierce > 1", () => {
    const p = new Projectile();
    p.activate(Vector2.ZERO, new Vector2(1, 0), DEFAULT_PROJECTILE_CONFIG, 3);
    expect(p.onHitEnemy()).toBe(false);
    expect(p.active).toBe(true);
    expect(p.onHitEnemy()).toBe(false);
    expect(p.active).toBe(true);
    expect(p.onHitEnemy()).toBe(true);
    expect(p.active).toBe(false);
  });

  it("deactivate sets active to false", () => {
    const p = new Projectile();
    p.activate(Vector2.ZERO, new Vector2(1, 0), DEFAULT_PROJECTILE_CONFIG, 1);
    p.deactivate();
    expect(p.active).toBe(false);
  });

  it("render does not throw when active", () => {
    const p = new Projectile();
    p.activate(Vector2.ZERO, new Vector2(1, 0), DEFAULT_PROJECTILE_CONFIG, 1);
    expect(() => p.render(mockCtx())).not.toThrow();
  });

  it("render does not throw when inactive", () => {
    const p = new Projectile();
    expect(() => p.render(mockCtx())).not.toThrow();
  });

  it("normalizes diagonal direction", () => {
    const p = new Projectile();
    p.activate(Vector2.ZERO, new Vector2(1, 1), DEFAULT_PROJECTILE_CONFIG, 1);
    p.update(1);
    const dist = p.position.magnitude();
    expect(dist).toBeCloseTo(400); // speed, not speed * sqrt(2)
  });
});
