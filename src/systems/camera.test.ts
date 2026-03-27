import { describe, it, expect, vi } from "vitest";
import { Camera } from "./camera";
import { Vector2 } from "../utils/vector2";

describe("Camera", () => {
  it("starts at origin", () => {
    const camera = new Camera();
    expect(camera.position.equals(Vector2.ZERO)).toBe(true);
  });

  it("update sets position to target", () => {
    const camera = new Camera();
    camera.update(new Vector2(100, 200), 1 / 60);
    expect(camera.position.x).toBe(100);
    expect(camera.position.y).toBe(200);
  });

  it("applyTransform translates so target appears at screen center", () => {
    const camera = new Camera();
    camera.update(new Vector2(100, 200), 1 / 60);

    const translate = vi.fn();
    const save = vi.fn();
    const ctx = { save, translate } as unknown as CanvasRenderingContext2D;

    camera.applyTransform(ctx, 800, 600);

    expect(save).toHaveBeenCalled();
    // screen center (400, 300) minus camera position (100, 200) = (300, 100)
    expect(translate).toHaveBeenCalledWith(300, 100);
  });

  it("resetTransform calls restore", () => {
    const camera = new Camera();
    const restore = vi.fn();
    const ctx = { restore } as unknown as CanvasRenderingContext2D;

    camera.resetTransform(ctx);
    expect(restore).toHaveBeenCalled();
  });

  it("player at origin on 800x600 screen translates to (400, 300)", () => {
    const camera = new Camera();
    camera.update(Vector2.ZERO, 1 / 60);

    const translate = vi.fn();
    const save = vi.fn();
    const ctx = { save, translate } as unknown as CanvasRenderingContext2D;

    camera.applyTransform(ctx, 800, 600);
    expect(translate).toHaveBeenCalledWith(400, 300);
  });
});
