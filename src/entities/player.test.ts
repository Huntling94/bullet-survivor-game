import { describe, it, expect, vi } from "vitest";
import { Player } from "./player";
import { Vector2 } from "../utils/vector2";
import { InputState } from "../systems/input";

function noInput(): InputState {
  return { up: false, down: false, left: false, right: false };
}

function mockCtx(): CanvasRenderingContext2D {
  return {
    fillStyle: "",
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("Player", () => {
  it("starts at given position", () => {
    const player = new Player(new Vector2(100, 200));
    expect(player.position.x).toBe(100);
    expect(player.position.y).toBe(200);
  });

  it("defaults to origin", () => {
    const player = new Player();
    expect(player.position.equals(Vector2.ZERO)).toBe(true);
  });

  it("does not move with no input", () => {
    const player = new Player();
    player.update(1, noInput());
    expect(player.position.equals(Vector2.ZERO)).toBe(true);
  });

  it("moves right when right is pressed", () => {
    const player = new Player();
    player.update(1, { ...noInput(), right: true });
    expect(player.position.x).toBeCloseTo(200);
    expect(player.position.y).toBeCloseTo(0);
  });

  it("moves left when left is pressed", () => {
    const player = new Player();
    player.update(1, { ...noInput(), left: true });
    expect(player.position.x).toBeCloseTo(-200);
    expect(player.position.y).toBeCloseTo(0);
  });

  it("moves up when up is pressed (negative Y)", () => {
    const player = new Player();
    player.update(1, { ...noInput(), up: true });
    expect(player.position.x).toBeCloseTo(0);
    expect(player.position.y).toBeCloseTo(-200);
  });

  it("moves down when down is pressed (positive Y)", () => {
    const player = new Player();
    player.update(1, { ...noInput(), down: true });
    expect(player.position.x).toBeCloseTo(0);
    expect(player.position.y).toBeCloseTo(200);
  });

  it("normalizes diagonal movement", () => {
    const player = new Player();
    player.update(1, { ...noInput(), up: true, right: true });

    const displacement = player.position.magnitude();
    // Should be exactly PLAYER_SPEED (200), not 200 * sqrt(2) ≈ 282.8
    expect(displacement).toBeCloseTo(200, 5);
  });

  it("scales movement by dt", () => {
    const player = new Player();
    // Half a second at 200 px/s = 100 px
    player.update(0.5, { ...noInput(), right: true });
    expect(player.position.x).toBeCloseTo(100);
  });

  it("starts with full health", () => {
    const player = new Player();
    expect(player.health).toBe(player.maxHealth);
  });

  it("render does not throw", () => {
    const player = new Player();
    expect(() => player.render(mockCtx())).not.toThrow();
  });
});
