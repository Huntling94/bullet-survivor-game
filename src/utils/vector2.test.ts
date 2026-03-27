import { describe, it, expect } from "vitest";
import { Vector2 } from "./vector2";

describe("Vector2", () => {
  it("constructs with x and y", () => {
    const v = new Vector2(3, 4);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  it("ZERO is (0, 0)", () => {
    expect(Vector2.ZERO.x).toBe(0);
    expect(Vector2.ZERO.y).toBe(0);
  });

  it("adds two vectors", () => {
    const a = new Vector2(1, 2);
    const b = new Vector2(3, 4);
    const result = a.add(b);
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });

  it("subtracts two vectors", () => {
    const a = new Vector2(5, 7);
    const b = new Vector2(2, 3);
    const result = a.subtract(b);
    expect(result.x).toBe(3);
    expect(result.y).toBe(4);
  });

  it("scales by a scalar", () => {
    const v = new Vector2(3, 4);
    const result = v.scale(2);
    expect(result.x).toBe(6);
    expect(result.y).toBe(8);
  });

  it("computes magnitude (3-4-5 triangle)", () => {
    const v = new Vector2(3, 4);
    expect(v.magnitude()).toBe(5);
  });

  it("normalizes to unit length", () => {
    const v = new Vector2(3, 4);
    const n = v.normalize();
    expect(n.magnitude()).toBeCloseTo(1, 10);
    expect(n.x).toBeCloseTo(0.6, 10);
    expect(n.y).toBeCloseTo(0.8, 10);
  });

  it("normalizing zero vector returns zero (no NaN)", () => {
    const n = Vector2.ZERO.normalize();
    expect(n.x).toBe(0);
    expect(n.y).toBe(0);
  });

  it("computes distance between two points", () => {
    const a = new Vector2(1, 1);
    const b = new Vector2(4, 5);
    expect(a.distanceTo(b)).toBe(5);
  });

  it("computes dot product", () => {
    const a = new Vector2(1, 2);
    const b = new Vector2(3, 4);
    expect(a.dot(b)).toBe(11);
  });

  it("equals checks value equality", () => {
    const a = new Vector2(1, 2);
    const b = new Vector2(1, 2);
    const c = new Vector2(3, 4);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it("clone creates a new instance with same values", () => {
    const a = new Vector2(1, 2);
    const b = a.clone();
    expect(b.equals(a)).toBe(true);
    expect(b).not.toBe(a);
  });

  it("operations do not mutate the original", () => {
    const a = new Vector2(1, 2);
    const b = new Vector2(3, 4);
    a.add(b);
    a.subtract(b);
    a.scale(10);
    a.normalize();
    expect(a.x).toBe(1);
    expect(a.y).toBe(2);
  });

  it("toString returns readable format", () => {
    const v = new Vector2(1, 2);
    expect(v.toString()).toBe("Vector2(1, 2)");
  });
});
