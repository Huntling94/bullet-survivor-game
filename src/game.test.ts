import { describe, it, expect, vi } from "vitest";
import { Game } from "./game";
import { InputState } from "./systems/input";

function noInput(): InputState {
  return { up: false, down: false, left: false, right: false };
}

function mockCtx(): CanvasRenderingContext2D {
  return {
    fillStyle: "",
    font: "",
    textBaseline: "",
    globalAlpha: 1,
    fillRect: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    strokeStyle: "",
    lineWidth: 1,
    textAlign: "start" as CanvasTextAlign,
  } as unknown as CanvasRenderingContext2D;
}

describe("Game", () => {
  it("starts with fps at 0", () => {
    const game = new Game(800, 600, noInput());
    expect(game.fps).toBe(0);
  });

  it("computes fps after interval elapses", () => {
    const game = new Game(800, 600, noInput());
    for (let i = 0; i < 31; i++) {
      game.update(1 / 60);
    }
    expect(game.fps).toBe(60);
  });

  it("resize updates dimensions", () => {
    const game = new Game(800, 600, noInput());
    game.resize(1920, 1080);
    expect(game.width).toBe(1920);
    expect(game.height).toBe(1080);
  });

  it("render does not throw", () => {
    const game = new Game(800, 600, noInput());
    expect(() => game.render(mockCtx())).not.toThrow();
  });

  it("player moves right when right input is active", () => {
    const input = { ...noInput(), right: true };
    const game = new Game(800, 600, input);
    game.update(1);
    expect(game.player.position.x).toBeGreaterThan(0);
  });

  it("camera follows player position", () => {
    const input = { ...noInput(), right: true };
    const game = new Game(800, 600, input);
    game.update(1);
    expect(game.camera.position.equals(game.player.position)).toBe(true);
  });

  it("spawns enemies over time", () => {
    const game = new Game(800, 600, noInput());
    expect(game.enemies.length).toBe(0);
    // Advance past spawn interval (2.0s)
    game.update(2.1);
    expect(game.enemies.length).toBeGreaterThan(0);
  });

  it("enemies move toward player", () => {
    const game = new Game(800, 600, noInput());
    game.update(2.1); // spawn enemies
    const enemy = game.enemies[0];
    if (!enemy) return;
    const initialDist = enemy.position.distanceTo(game.player.position);
    game.update(1);
    const newDist = enemy.position.distanceTo(game.player.position);
    expect(newDist).toBeLessThan(initialDist);
  });

  it("starts at wave 1", () => {
    const game = new Game(800, 600, noInput());
    expect(game.spawner.waveNumber).toBe(1);
  });

  it("render with enemies does not throw", () => {
    const game = new Game(800, 600, noInput());
    game.update(2.1); // spawn enemies
    expect(game.enemies.length).toBeGreaterThan(0);
    expect(() => game.render(mockCtx())).not.toThrow();
  });

  it("game over when player health reaches 0", () => {
    const game = new Game(800, 600, noInput());
    expect(game.gameOver).toBe(false);
    // Manually kill the player
    game.player.takeDamage(100);
    game.update(1.1); // advance past i-frames (shouldn't matter, health already 0)
    // Need to trigger the death check — set health to 0 directly since
    // takeDamage won't re-trigger during i-frames
    game.player.health = 0;
    game.update(0.016);
    expect(game.gameOver).toBe(true);
  });

  it("update stops when game is over", () => {
    const game = new Game(800, 600, noInput());
    game.player.health = 0;
    game.update(0.016); // triggers game over
    const playerPos = game.player.position.clone();
    game.update(10); // should do nothing
    expect(game.player.position.equals(playerPos)).toBe(true);
  });

  it("render game over does not throw", () => {
    const game = new Game(800, 600, noInput());
    game.player.health = 0;
    game.update(0.016);
    const ctx = mockCtx();
    expect(() => game.render(ctx)).not.toThrow();
  });
});
