import { describe, it, expect, vi } from "vitest";
import { Game } from "./game";
import { InputHandler } from "./systems/input";
import { Enemy, ENEMY_CONFIGS } from "./entities/enemy";
import { Vector2 } from "./utils/vector2";

function createInput(): InputHandler {
  return new InputHandler();
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
    strokeRect: vi.fn(),
    strokeStyle: "",
    lineWidth: 1,
    textAlign: "start" as CanvasTextAlign,
  } as unknown as CanvasRenderingContext2D;
}

describe("Game", () => {
  it("starts with fps at 0", () => {
    const game = new Game(800, 600, createInput());
    expect(game.fps).toBe(0);
  });

  it("computes fps after interval elapses", () => {
    const game = new Game(800, 600, createInput());
    for (let i = 0; i < 31; i++) {
      game.update(1 / 60);
    }
    expect(game.fps).toBe(60);
  });

  it("render does not throw", () => {
    const game = new Game(800, 600, createInput());
    expect(() => game.render(mockCtx())).not.toThrow();
  });

  it("player moves right when right input is active", () => {
    const input = createInput();
    input.handleKeyDown("d");
    const game = new Game(800, 600, input);
    game.update(1);
    expect(game.player.position.x).toBeGreaterThan(0);
  });

  it("spawns enemies over time", () => {
    const game = new Game(800, 600, createInput());
    game.update(2.1);
    expect(game.enemies.length).toBeGreaterThan(0);
  });

  it("game over when player health reaches 0", () => {
    const game = new Game(800, 600, createInput());
    game.player.health = 0;
    game.update(0.016);
    expect(game.gameOver).toBe(true);
  });

  it("weapon fires at nearby enemy", () => {
    const game = new Game(800, 600, createInput());
    game.enemies.push(new Enemy(new Vector2(100, 0), ENEMY_CONFIGS.shambler));
    game.update(0.016);
    expect(game.projectilePool.activeLength).toBeGreaterThan(0);
  });

  it("does not fire when no enemies exist", () => {
    const game = new Game(800, 600, createInput());
    game.update(0.016);
    expect(game.projectilePool.activeLength).toBe(0);
  });

  it("killed enemy drops XP that gets collected", () => {
    const game = new Game(800, 600, createInput());
    const enemy = new Enemy(new Vector2(30, 0), ENEMY_CONFIGS.runner);
    game.enemies.push(enemy);
    // Run frames to kill the runner (15hp, 10 damage per hit)
    // Gem spawns at enemy position, close enough to collect
    for (let i = 0; i < 60; i++) {
      game.update(1 / 60);
    }
    // Runner drops 1 XP, should have been collected
    expect(game.leveling.currentXp).toBeGreaterThan(0);
  });

  it("collecting gem adds XP", () => {
    const game = new Game(800, 600, createInput());
    // Manually spawn a gem at the player's position (instant collect)
    const gem = game.gemPool.acquire();
    gem.activate(game.player.position, 5);
    game.update(0.016);
    expect(game.leveling.currentXp).toBe(5);
  });

  it("level up pauses game", () => {
    const game = new Game(800, 600, createInput());
    // Add enough XP to level up (need 20 for level 1→2)
    for (let i = 0; i < 7; i++) {
      const gem = game.gemPool.acquire();
      gem.activate(game.player.position, 3);
    }
    game.update(0.016);
    expect(game.paused).toBe(true);
    expect(game.leveling.pendingUpgradeChoices).not.toBe(null);
  });

  it("selecting upgrade resumes game", () => {
    const input = createInput();
    const game = new Game(800, 600, input);
    // Trigger level up
    for (let i = 0; i < 7; i++) {
      const gem = game.gemPool.acquire();
      gem.activate(game.player.position, 3);
    }
    game.update(0.016);
    expect(game.paused).toBe(true);

    // Select upgrade 1
    input.handleKeyDown("1");
    expect(game.paused).toBe(false);
    expect(game.leveling.pendingUpgradeChoices).toBe(null);
  });

  it("update does not run while paused", () => {
    const input = createInput();
    const game = new Game(800, 600, input);
    for (let i = 0; i < 7; i++) {
      const gem = game.gemPool.acquire();
      gem.activate(game.player.position, 3);
    }
    game.update(0.016);
    expect(game.paused).toBe(true);

    const playerPos = game.player.position.clone();
    input.handleKeyDown("d"); // try to move
    game.update(1);
    // Still paused, player hasn't moved
    expect(game.player.position.equals(playerPos)).toBe(true);
  });

  it("render with upgrade UI does not throw", () => {
    const game = new Game(800, 600, createInput());
    for (let i = 0; i < 7; i++) {
      const gem = game.gemPool.acquire();
      gem.activate(game.player.position, 3);
    }
    game.update(0.016);
    expect(game.paused).toBe(true);
    expect(() => game.render(mockCtx())).not.toThrow();
  });

  it("game over screen shows level", () => {
    const game = new Game(800, 600, createInput());
    game.player.health = 0;
    game.update(0.016);
    const ctx = mockCtx();
    game.render(ctx);
    // Check that fillText was called with level info
    const calls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls;
    const hasLevel = calls.some(
      (c: unknown[]) =>
        typeof c[0] === "string" && (c[0] as string).includes("Lv"),
    );
    expect(hasLevel).toBe(true);
  });
});
