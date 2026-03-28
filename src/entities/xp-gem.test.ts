import { describe, it, expect, vi } from "vitest";
import { XpGem } from "./xp-gem";
import { Vector2 } from "../utils/vector2";

function mockCtx(): CanvasRenderingContext2D {
  return {
    fillStyle: "",
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("XpGem", () => {
  it("starts inactive", () => {
    const gem = new XpGem();
    expect(gem.active).toBe(false);
  });

  it("activate sets position, xpValue, and active", () => {
    const gem = new XpGem();
    gem.activate(new Vector2(50, 60), 3);
    expect(gem.active).toBe(true);
    expect(gem.position.x).toBe(50);
    expect(gem.position.y).toBe(60);
    expect(gem.xpValue).toBe(3);
  });

  it("returns true when within collect radius", () => {
    const gem = new XpGem();
    gem.activate(new Vector2(10, 0), 1);
    // 10px < 24px collect radius
    const collected = gem.update(0.016, Vector2.ZERO, 100);
    expect(collected).toBe(true);
  });

  it("returns false when outside magnetic radius", () => {
    const gem = new XpGem();
    gem.activate(new Vector2(200, 0), 1);
    // 200px > 100px magnetic radius
    const collected = gem.update(0.016, Vector2.ZERO, 100);
    expect(collected).toBe(false);
  });

  it("does not move when outside magnetic radius", () => {
    const gem = new XpGem();
    gem.activate(new Vector2(200, 0), 1);
    gem.update(0.016, Vector2.ZERO, 100);
    expect(gem.position.x).toBe(200);
  });

  it("moves toward player when within magnetic radius", () => {
    const gem = new XpGem();
    gem.activate(new Vector2(80, 0), 1);
    // 80px < 100px magnetic radius
    gem.update(0.1, Vector2.ZERO, 100);
    expect(gem.position.x).toBeLessThan(80);
  });

  it("magnetic pull is stronger when closer", () => {
    const farGem = new XpGem();
    farGem.activate(new Vector2(90, 0), 1);
    const nearGem = new XpGem();
    nearGem.activate(new Vector2(40, 0), 1);

    farGem.update(0.1, Vector2.ZERO, 100);
    nearGem.update(0.1, Vector2.ZERO, 100);

    const farMove = 90 - farGem.position.x;
    const nearMove = 40 - nearGem.position.x;
    expect(nearMove).toBeGreaterThan(farMove);
  });

  it("deactivate sets active to false", () => {
    const gem = new XpGem();
    gem.activate(Vector2.ZERO, 1);
    gem.deactivate();
    expect(gem.active).toBe(false);
  });

  it("inactive gem returns false on update", () => {
    const gem = new XpGem();
    const collected = gem.update(0.016, Vector2.ZERO, 100);
    expect(collected).toBe(false);
  });

  it("small gem (1 XP) is green", () => {
    const gem = new XpGem();
    gem.activate(Vector2.ZERO, 1);
    expect(gem.radius).toBe(4);
  });

  it("medium gem (5 XP) is larger", () => {
    const gem = new XpGem();
    gem.activate(Vector2.ZERO, 5);
    expect(gem.radius).toBe(6);
  });

  it("large gem (25 XP) is largest", () => {
    const gem = new XpGem();
    gem.activate(Vector2.ZERO, 25);
    expect(gem.radius).toBe(8);
  });

  it("render does not throw", () => {
    const gem = new XpGem();
    gem.activate(Vector2.ZERO, 1);
    expect(() => gem.render(mockCtx())).not.toThrow();
  });
});
