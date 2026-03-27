import { describe, it, expect, vi } from "vitest";
import { Game } from "./game";

describe("Game", () => {
  it("starts with fps at 0", () => {
    const game = new Game(800, 600);
    expect(game.fps).toBe(0);
  });

  it("does not update fps before interval elapses", () => {
    const game = new Game(800, 600);
    // Simulate 10 frames at 60fps (each ~16.67ms)
    for (let i = 0; i < 10; i++) {
      game.update(1 / 60);
    }
    // 10 frames * 16.67ms = ~167ms < 500ms interval
    expect(game.fps).toBe(0);
  });

  it("computes fps after interval elapses", () => {
    const game = new Game(800, 600);
    // Simulate 31 frames at 60fps to push past 0.5s
    // (30 * 1/60 = 0.4999... due to floating point, need 31 to cross)
    for (let i = 0; i < 31; i++) {
      game.update(1 / 60);
    }
    expect(game.fps).toBe(60);
  });

  it("computes fps correctly at 30fps", () => {
    const game = new Game(800, 600);
    // Simulate 16 frames at 30fps to push past 0.5s
    for (let i = 0; i < 16; i++) {
      game.update(1 / 30);
    }
    expect(game.fps).toBe(30);
  });

  it("resets accumulator after computing fps", () => {
    const game = new Game(800, 600);
    // First interval: 60fps
    for (let i = 0; i < 31; i++) {
      game.update(1 / 60);
    }
    expect(game.fps).toBe(60);

    // Second interval: 30fps
    for (let i = 0; i < 16; i++) {
      game.update(1 / 30);
    }
    expect(game.fps).toBe(30);
  });

  it("resize updates dimensions", () => {
    const game = new Game(800, 600);
    game.resize(1920, 1080);
    expect(game.width).toBe(1920);
    expect(game.height).toBe(1080);
  });

  it("render calls expected canvas methods", () => {
    const game = new Game(800, 600);
    const ctx = {
      fillStyle: "",
      font: "",
      textBaseline: "",
      fillRect: vi.fn(),
      fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    game.render(ctx);

    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    expect(ctx.fillText).toHaveBeenCalledWith("FPS: 0", 10, 20);
  });
});
