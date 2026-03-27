import { describe, it, expect } from "vitest";
import { Spawner } from "./spawner";
import { Vector2 } from "../utils/vector2";

const SCREEN_W = 800;
const SCREEN_H = 600;

describe("Spawner", () => {
  it("starts at wave 1", () => {
    const spawner = new Spawner();
    expect(spawner.waveNumber).toBe(1);
  });

  it("spawns enemies after spawn interval", () => {
    const spawner = new Spawner();
    // Initial interval is 2.0s
    const instructions = spawner.update(
      2.1,
      Vector2.ZERO,
      SCREEN_W,
      SCREEN_H,
      0,
    );
    expect(instructions.length).toBeGreaterThan(0);
  });

  it("does not spawn before interval", () => {
    const spawner = new Spawner();
    const instructions = spawner.update(
      0.5,
      Vector2.ZERO,
      SCREEN_W,
      SCREEN_H,
      0,
    );
    expect(instructions.length).toBe(0);
  });

  it("respects max enemy cap", () => {
    const spawner = new Spawner();
    const instructions = spawner.update(
      2.1,
      Vector2.ZERO,
      SCREEN_W,
      SCREEN_H,
      spawner.maxEnemies,
    );
    expect(instructions.length).toBe(0);
  });

  it("advances wave after wave duration", () => {
    const spawner = new Spawner();
    spawner.update(31, Vector2.ZERO, SCREEN_W, SCREEN_H, 0);
    expect(spawner.waveNumber).toBe(2);
  });

  it("max enemies increases with wave", () => {
    const spawner = new Spawner();
    const wave1Max = spawner.maxEnemies;
    spawner.update(31, Vector2.ZERO, SCREEN_W, SCREEN_H, 0);
    expect(spawner.maxEnemies).toBeGreaterThan(wave1Max);
  });

  it("spawn position is outside viewport", () => {
    const spawner = new Spawner();
    const halfDiagonal =
      Math.sqrt(SCREEN_W * SCREEN_W + SCREEN_H * SCREEN_H) / 2;

    const instructions = spawner.update(
      2.1,
      Vector2.ZERO,
      SCREEN_W,
      SCREEN_H,
      0,
    );

    for (const inst of instructions) {
      const dist = inst.position.distanceTo(Vector2.ZERO);
      expect(dist).toBeGreaterThan(halfDiagonal);
    }
  });

  it("only spawns shamblers in wave 1", () => {
    const spawner = new Spawner();
    // Spawn several enemies within wave 1 (< 30s)
    const allInstructions: { type: string }[] = [];
    for (let t = 0; t < 25; t += 2.1) {
      const instructions = spawner.update(
        2.1,
        Vector2.ZERO,
        SCREEN_W,
        SCREEN_H,
        0,
      );
      allInstructions.push(...instructions);
    }
    expect(allInstructions.length).toBeGreaterThan(0);
    for (const inst of allInstructions) {
      expect(inst.type).toBe("shambler");
    }
  });

  it("despawn radius is larger than spawn radius", () => {
    const spawner = new Spawner();
    const halfDiag =
      Math.sqrt(SCREEN_W * SCREEN_W + SCREEN_H * SCREEN_H) / 2 + 50;
    const despawnRadius = spawner.getDespawnRadius(SCREEN_W, SCREEN_H);
    expect(despawnRadius).toBeGreaterThan(halfDiag);
  });
});
