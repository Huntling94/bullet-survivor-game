import { describe, it, expect, vi } from "vitest";
import { Particle, ParticleSystem, HIT_SPARK_CONFIG } from "./particle";
import { Vector2 } from "../utils/vector2";

function mockCtx(): CanvasRenderingContext2D {
  return {
    globalAlpha: 1,
    fillStyle: "",
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("Particle", () => {
  it("starts inactive", () => {
    const p = new Particle();
    expect(p.active).toBe(false);
  });

  it("activate sets properties", () => {
    const p = new Particle();
    p.activate(new Vector2(10, 20), new Vector2(1, 0), 3, "#fff", 0.5);
    expect(p.active).toBe(true);
    expect(p.position.x).toBe(10);
    expect(p.size).toBe(3);
    expect(p.alpha).toBe(1);
  });

  it("moves along velocity", () => {
    const p = new Particle();
    p.activate(Vector2.ZERO, new Vector2(100, 0), 3, "#fff", 1);
    p.update(0.5);
    expect(p.position.x).toBeCloseTo(50);
  });

  it("alpha decays with lifetime", () => {
    const p = new Particle();
    p.activate(Vector2.ZERO, Vector2.ZERO, 3, "#fff", 1);
    p.update(0.5);
    expect(p.alpha).toBeCloseTo(0.5);
  });

  it("deactivates when lifetime expires", () => {
    const p = new Particle();
    p.activate(Vector2.ZERO, Vector2.ZERO, 3, "#fff", 0.5);
    p.update(0.6);
    expect(p.active).toBe(false);
  });

  it("render does not throw", () => {
    const p = new Particle();
    p.activate(Vector2.ZERO, Vector2.ZERO, 3, "#fff", 1);
    expect(() => p.render(mockCtx())).not.toThrow();
  });
});

describe("ParticleSystem", () => {
  it("burst creates particles", () => {
    const system = new ParticleSystem();
    system.burst(Vector2.ZERO, 10, HIT_SPARK_CONFIG);
    expect(system.activeCount).toBe(10);
  });

  it("update releases expired particles", () => {
    const system = new ParticleSystem();
    system.burst(Vector2.ZERO, 5, HIT_SPARK_CONFIG);
    expect(system.activeCount).toBe(5);
    // HIT_SPARK lifetime is 0.15s
    system.update(0.2);
    expect(system.activeCount).toBe(0);
  });

  it("render does not throw", () => {
    const system = new ParticleSystem();
    system.burst(Vector2.ZERO, 5, HIT_SPARK_CONFIG);
    expect(() => system.render(mockCtx())).not.toThrow();
  });
});
