import { describe, it, expect, vi } from "vitest";
import { Game } from "./game";
import { InputState } from "./systems/input";
import { Enemy, ENEMY_CONFIGS } from "./entities/enemy";
import { Vector2 } from "./utils/vector2";

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
    game.update(2.1);
    expect(game.enemies.length).toBeGreaterThan(0);
  });

  it("enemies move toward player", () => {
    const game = new Game(800, 600, noInput());
    game.update(2.1);
    const enemy = game.enemies[0];
    if (!enemy) return;
    const initialDist = enemy.position.distanceTo(game.player.position);
    game.update(1);
    const newDist = enemy.position.distanceTo(game.player.position);
    expect(newDist).toBeLessThan(initialDist);
  });

  it("game over when player health reaches 0", () => {
    const game = new Game(800, 600, noInput());
    game.player.health = 0;
    game.update(0.016);
    expect(game.gameOver).toBe(true);
  });

  it("update stops when game is over", () => {
    const game = new Game(800, 600, noInput());
    game.player.health = 0;
    game.update(0.016);
    const playerPos = game.player.position.clone();
    game.update(10);
    expect(game.player.position.equals(playerPos)).toBe(true);
  });

  it("weapon fires at nearby enemy", () => {
    const game = new Game(800, 600, noInput());
    // Place an enemy near the player
    game.enemies.push(new Enemy(new Vector2(100, 0), ENEMY_CONFIGS.shambler));
    // First update: weapon fires (timer starts at 0 = ready)
    game.update(0.016);
    expect(game.projectilePool.activeLength).toBeGreaterThan(0);
  });

  it("does not fire when no enemies exist", () => {
    const game = new Game(800, 600, noInput());
    game.update(0.016);
    expect(game.projectilePool.activeLength).toBe(0);
  });

  it("projectile damages enemy", () => {
    const game = new Game(800, 600, noInput());
    // Place enemy close enough that projectile hits quickly
    const enemy = new Enemy(new Vector2(30, 0), ENEMY_CONFIGS.shambler);
    game.enemies.push(enemy);
    // Run several frames to fire and hit
    for (let i = 0; i < 10; i++) {
      game.update(0.05);
    }
    expect(enemy.health).toBeLessThan(ENEMY_CONFIGS.shambler.maxHealth);
  });

  it("enemy removed when killed by projectiles", () => {
    const game = new Game(800, 600, noInput());
    const enemy = new Enemy(new Vector2(30, 0), ENEMY_CONFIGS.runner);
    game.enemies.push(enemy);
    // Runner has 15hp, weapon does 10 damage. 2 hits needed.
    // Fire rate 0.4s, run for 2 seconds to ensure multiple hits
    for (let i = 0; i < 120; i++) {
      game.update(1 / 60);
    }
    expect(game.enemies.includes(enemy)).toBe(false);
  });

  it("render with projectiles does not throw", () => {
    const game = new Game(800, 600, noInput());
    game.enemies.push(new Enemy(new Vector2(100, 0), ENEMY_CONFIGS.shambler));
    game.update(0.016);
    expect(game.projectilePool.activeLength).toBeGreaterThan(0);
    expect(() => game.render(mockCtx())).not.toThrow();
  });
});
