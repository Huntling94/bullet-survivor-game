import { describe, it, expect, vi } from "vitest";
import { DamageNumber, DamageNumberSystem } from "./damage-number";
import { Vector2 } from "../utils/vector2";

function mockCtx(): CanvasRenderingContext2D {
  return {
    globalAlpha: 1,
    fillStyle: "",
    font: "",
    textAlign: "start" as CanvasTextAlign,
    textBaseline: "alphabetic" as CanvasTextBaseline,
    fillText: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("DamageNumber", () => {
  it("starts inactive", () => {
    const dn = new DamageNumber();
    expect(dn.active).toBe(false);
  });

  it("activate sets properties", () => {
    const dn = new DamageNumber();
    dn.activate(new Vector2(10, 20), 15, false);
    expect(dn.active).toBe(true);
    expect(dn.text).toBe("15");
    expect(dn.alpha).toBe(1);
  });

  it("floats upward", () => {
    const dn = new DamageNumber();
    dn.activate(new Vector2(0, 100), 10, false);
    dn.update(0.1);
    expect(dn.position.y).toBeLessThan(100);
  });

  it("alpha decays over lifetime", () => {
    const dn = new DamageNumber();
    dn.activate(Vector2.ZERO, 10, false);
    dn.update(0.3); // half of 0.6s lifetime
    expect(dn.alpha).toBeCloseTo(0.5);
  });

  it("deactivates when expired", () => {
    const dn = new DamageNumber();
    dn.activate(Vector2.ZERO, 10, false);
    dn.update(0.7);
    expect(dn.active).toBe(false);
  });

  it("kill numbers are yellow", () => {
    const dn = new DamageNumber();
    dn.activate(Vector2.ZERO, 10, true);
    expect(dn.color).toBe("#ffeb3b");
  });

  it("normal numbers are white", () => {
    const dn = new DamageNumber();
    dn.activate(Vector2.ZERO, 10, false);
    expect(dn.color).toBe("#fff");
  });

  it("render does not throw", () => {
    const dn = new DamageNumber();
    dn.activate(Vector2.ZERO, 10, false);
    expect(() => dn.render(mockCtx())).not.toThrow();
  });
});

describe("DamageNumberSystem", () => {
  it("spawn creates damage number", () => {
    const system = new DamageNumberSystem();
    system.spawn(Vector2.ZERO, 10, false);
    expect(system.activeCount).toBe(1);
  });

  it("update releases expired numbers", () => {
    const system = new DamageNumberSystem();
    system.spawn(Vector2.ZERO, 10, false);
    system.update(0.7);
    expect(system.activeCount).toBe(0);
  });

  it("render does not throw", () => {
    const system = new DamageNumberSystem();
    system.spawn(Vector2.ZERO, 10, false);
    expect(() => system.render(mockCtx())).not.toThrow();
  });
});
