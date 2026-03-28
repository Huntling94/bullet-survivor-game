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
    globalAlpha: 1,
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
    expect(displacement).toBeCloseTo(200, 5);
  });

  it("scales movement by dt", () => {
    const player = new Player();
    player.update(0.5, { ...noInput(), right: true });
    expect(player.position.x).toBeCloseTo(100);
  });

  it("modified speed affects movement", () => {
    const player = new Player();
    player.speed = 400;
    player.update(1, { ...noInput(), right: true });
    expect(player.position.x).toBeCloseTo(400);
  });

  it("has default pickup radius", () => {
    const player = new Player();
    expect(player.pickupRadius).toBe(100);
  });

  it("starts with full health", () => {
    const player = new Player();
    expect(player.health).toBe(player.maxHealth);
  });

  it("takeDamage reduces health", () => {
    const player = new Player();
    player.takeDamage(10);
    expect(player.health).toBe(90);
  });

  it("takeDamage clamps health to 0", () => {
    const player = new Player();
    player.takeDamage(999);
    expect(player.health).toBe(0);
  });

  it("is invincible after taking damage", () => {
    const player = new Player();
    player.takeDamage(10);
    expect(player.isInvincible).toBe(true);
  });

  it("invincibility prevents further damage", () => {
    const player = new Player();
    player.takeDamage(10);
    player.takeDamage(10);
    expect(player.health).toBe(90);
  });

  it("invincibility expires after duration", () => {
    const player = new Player();
    player.takeDamage(10);
    // Advance time past invincibility duration (1.0s)
    player.update(1.1, noInput());
    expect(player.isInvincible).toBe(false);
    player.takeDamage(10);
    expect(player.health).toBe(80);
  });

  it("invincibility timer ticks down with dt", () => {
    const player = new Player();
    player.takeDamage(10);
    player.update(0.5, noInput());
    expect(player.isInvincible).toBe(true);
    player.update(0.6, noInput());
    expect(player.isInvincible).toBe(false);
  });

  it("render does not throw", () => {
    const player = new Player();
    expect(() => player.render(mockCtx())).not.toThrow();
  });

  it("render does not throw while invincible", () => {
    const player = new Player();
    player.takeDamage(10);
    expect(() => player.render(mockCtx())).not.toThrow();
  });
});
