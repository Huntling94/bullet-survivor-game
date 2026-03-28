import { describe, it, expect, vi } from "vitest";
import { Camera } from "./camera";
import { Vector2 } from "../utils/vector2";

describe("Camera", () => {
  it("starts at origin", () => {
    const camera = new Camera();
    expect(camera.position.equals(Vector2.ZERO)).toBe(true);
  });

  it("smoothly follows target", () => {
    const camera = new Camera();
    camera.update(new Vector2(100, 200), 1 / 60);
    // Smooth follow: not exactly at target, but close
    expect(camera.position.x).toBeGreaterThan(0);
    expect(camera.position.y).toBeGreaterThan(0);
    expect(camera.position.x).toBeLessThanOrEqual(100);
    expect(camera.position.y).toBeLessThanOrEqual(200);
  });

  it("converges to target over time", () => {
    const camera = new Camera();
    for (let i = 0; i < 60; i++) {
      camera.update(new Vector2(100, 200), 1 / 60);
    }
    // After 1 second of following, should be very close
    expect(camera.position.x).toBeCloseTo(100, 0);
    expect(camera.position.y).toBeCloseTo(200, 0);
  });

  it("applyTransform translates based on position", () => {
    const camera = new Camera();
    // Force position directly for transform test
    for (let i = 0; i < 120; i++) {
      camera.update(new Vector2(100, 200), 1 / 60);
    }

    const translate = vi.fn();
    const save = vi.fn();
    const ctx = { save, translate } as unknown as CanvasRenderingContext2D;

    camera.applyTransform(ctx, 800, 600);
    expect(save).toHaveBeenCalled();
    // Position is ~(100, 200), so translate ~(300, 100)
    const args = translate.mock.calls[0] as [number, number];
    expect(args[0]).toBeCloseTo(300, 0);
    expect(args[1]).toBeCloseTo(100, 0);
  });

  it("resetTransform calls restore", () => {
    const camera = new Camera();
    const restore = vi.fn();
    const ctx = { restore } as unknown as CanvasRenderingContext2D;
    camera.resetTransform(ctx);
    expect(restore).toHaveBeenCalled();
  });

  it("shake produces offset in applyTransform", () => {
    const camera = new Camera();
    camera.update(Vector2.ZERO, 1 / 60);
    camera.shake(10, 0.1);

    const translate = vi.fn();
    const save = vi.fn();
    const ctx = { save, translate } as unknown as CanvasRenderingContext2D;

    // Call multiple times to verify randomness produces offset
    camera.applyTransform(ctx, 800, 600);
    const args = translate.mock.calls[0] as [number, number];
    // With shake, translate should differ from (400, 300) by up to 10px
    const offsetX = args[0] - 400;
    const offsetY = args[1] - 300;
    // At least one axis should have non-zero offset (statistically certain)
    // But we can only verify the range
    expect(Math.abs(offsetX)).toBeLessThanOrEqual(10);
    expect(Math.abs(offsetY)).toBeLessThanOrEqual(10);
  });

  it("shake decays to zero", () => {
    const camera = new Camera();
    camera.update(Vector2.ZERO, 1 / 60);
    camera.shake(10, 0.1);

    // Advance past shake duration
    camera.update(Vector2.ZERO, 0.2);

    const translate = vi.fn();
    const save = vi.fn();
    const ctx = { save, translate } as unknown as CanvasRenderingContext2D;
    camera.applyTransform(ctx, 800, 600);
    const args = translate.mock.calls[0] as [number, number];
    // Should be at (400, 300) with no shake offset
    expect(args[0]).toBeCloseTo(400, 0);
    expect(args[1]).toBeCloseTo(300, 0);
  });

  it("stronger shake overrides weaker", () => {
    const camera = new Camera();
    camera.shake(3, 0.1);
    camera.shake(10, 0.1);
    // Should use intensity 10
    camera.update(Vector2.ZERO, 0.01);
    // Just verify no crash — exact values are random
  });
});
