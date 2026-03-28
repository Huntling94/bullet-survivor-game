import { describe, it, expect, vi } from "vitest";
import { Enemy, ENEMY_CONFIGS } from "./enemy";
import { Vector2 } from "../utils/vector2";

function mockCtx(): CanvasRenderingContext2D {
  return {
    fillStyle: "",
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("Enemy", () => {
  it("starts at given position with config stats", () => {
    const enemy = new Enemy(new Vector2(100, 200), ENEMY_CONFIGS.shambler);
    expect(enemy.position.x).toBe(100);
    expect(enemy.position.y).toBe(200);
    expect(enemy.health).toBe(30);
    expect(enemy.radius).toBe(12);
    expect(enemy.active).toBe(true);
  });

  it("moves toward target", () => {
    const enemy = new Enemy(new Vector2(100, 0), ENEMY_CONFIGS.shambler);
    enemy.update(1, Vector2.ZERO);
    expect(enemy.position.x).toBeLessThan(100);
    expect(enemy.position.x).toBeCloseTo(40); // 100 - 60 * 1
  });

  it("shambler moves at shambler speed", () => {
    const enemy = new Enemy(new Vector2(100, 0), ENEMY_CONFIGS.shambler);
    enemy.update(1, Vector2.ZERO);
    const displacement = new Vector2(100, 0).distanceTo(enemy.position);
    expect(displacement).toBeCloseTo(60); // shambler speed
  });

  it("runner moves at runner speed", () => {
    const enemy = new Enemy(new Vector2(100, 0), ENEMY_CONFIGS.runner);
    enemy.update(1, Vector2.ZERO);
    const displacement = new Vector2(100, 0).distanceTo(enemy.position);
    expect(displacement).toBeCloseTo(120); // runner speed
  });

  it("diagonal chase is normalized", () => {
    const enemy = new Enemy(new Vector2(100, 100), ENEMY_CONFIGS.shambler);
    enemy.update(1, Vector2.ZERO);
    const displacement = new Vector2(100, 100).distanceTo(enemy.position);
    expect(displacement).toBeCloseTo(60); // speed, not speed * sqrt(2)
  });

  it("does not update when inactive", () => {
    const enemy = new Enemy(new Vector2(100, 0), ENEMY_CONFIGS.shambler);
    enemy.active = false;
    enemy.update(1, Vector2.ZERO);
    expect(enemy.position.x).toBe(100);
  });

  it("shambler and runner have different configs", () => {
    expect(ENEMY_CONFIGS.shambler.speed).not.toBe(ENEMY_CONFIGS.runner.speed);
    expect(ENEMY_CONFIGS.shambler.radius).not.toBe(ENEMY_CONFIGS.runner.radius);
    expect(ENEMY_CONFIGS.shambler.maxHealth).not.toBe(
      ENEMY_CONFIGS.runner.maxHealth,
    );
    expect(ENEMY_CONFIGS.shambler.color).not.toBe(ENEMY_CONFIGS.runner.color);
  });

  it("takeDamage reduces health", () => {
    const enemy = new Enemy(Vector2.ZERO, ENEMY_CONFIGS.shambler);
    enemy.takeDamage(10);
    expect(enemy.health).toBe(20);
    expect(enemy.active).toBe(true);
  });

  it("takeDamage kills enemy at zero health", () => {
    const enemy = new Enemy(Vector2.ZERO, ENEMY_CONFIGS.shambler);
    enemy.takeDamage(30);
    expect(enemy.health).toBe(0);
    expect(enemy.active).toBe(false);
    expect(enemy.killed).toBe(true);
  });

  it("killed is false when despawned (not killed by damage)", () => {
    const enemy = new Enemy(Vector2.ZERO, ENEMY_CONFIGS.shambler);
    enemy.active = false;
    expect(enemy.killed).toBe(false);
  });

  it("takeDamage clamps health to zero", () => {
    const enemy = new Enemy(Vector2.ZERO, ENEMY_CONFIGS.shambler);
    enemy.takeDamage(999);
    expect(enemy.health).toBe(0);
  });

  it("takeDamage is no-op when inactive", () => {
    const enemy = new Enemy(Vector2.ZERO, ENEMY_CONFIGS.shambler);
    enemy.active = false;
    enemy.takeDamage(10);
    expect(enemy.health).toBe(30);
  });

  it("takeDamage triggers flash", () => {
    const enemy = new Enemy(Vector2.ZERO, ENEMY_CONFIGS.shambler);
    enemy.takeDamage(10);
    expect(enemy.flashTimer).toBeGreaterThan(0);
  });

  it("flash decays over time", () => {
    const enemy = new Enemy(Vector2.ZERO, ENEMY_CONFIGS.shambler);
    enemy.takeDamage(10);
    enemy.update(0.1, Vector2.ZERO);
    expect(enemy.flashTimer).toBe(0);
  });

  it("knockback pushes enemy away", () => {
    const enemy = new Enemy(new Vector2(50, 0), ENEMY_CONFIGS.shambler);
    enemy.takeDamage(10, new Vector2(1, 0)); // push rightward
    enemy.update(0.016, Vector2.ZERO);
    expect(enemy.position.x).toBeGreaterThan(50);
  });

  it("knockback decays and enemy resumes chase", () => {
    const enemy = new Enemy(new Vector2(100, 0), ENEMY_CONFIGS.shambler);
    enemy.takeDamage(10, new Vector2(1, 0));
    // After long enough, knockback decays and enemy chases again
    for (let i = 0; i < 60; i++) {
      enemy.update(1 / 60, Vector2.ZERO);
    }
    // Should be moving toward target (0,0) eventually
    const pos1 = enemy.position.x;
    enemy.update(0.5, Vector2.ZERO);
    expect(enemy.position.x).toBeLessThan(pos1);
  });

  it("render does not throw", () => {
    const enemy = new Enemy(Vector2.ZERO, ENEMY_CONFIGS.shambler);
    expect(() => enemy.render(mockCtx())).not.toThrow();
  });

  it("render does not throw when inactive", () => {
    const enemy = new Enemy(Vector2.ZERO, ENEMY_CONFIGS.shambler);
    enemy.active = false;
    expect(() => enemy.render(mockCtx())).not.toThrow();
  });
});
