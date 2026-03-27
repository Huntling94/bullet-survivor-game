import { describe, it, expect } from "vitest";
import { InputHandler, InputState } from "./input";

describe("InputHandler", () => {
  it("starts with all directions false", () => {
    const input = new InputHandler();
    expect(input.up).toBe(false);
    expect(input.down).toBe(false);
    expect(input.left).toBe(false);
    expect(input.right).toBe(false);
  });

  it("maps W to up", () => {
    const input = new InputHandler();
    input.handleKeyDown("w");
    expect(input.up).toBe(true);
  });

  it("maps S to down", () => {
    const input = new InputHandler();
    input.handleKeyDown("s");
    expect(input.down).toBe(true);
  });

  it("maps A to left", () => {
    const input = new InputHandler();
    input.handleKeyDown("a");
    expect(input.left).toBe(true);
  });

  it("maps D to right", () => {
    const input = new InputHandler();
    input.handleKeyDown("d");
    expect(input.right).toBe(true);
  });

  it("maps arrow keys", () => {
    const input = new InputHandler();
    input.handleKeyDown("ArrowUp");
    input.handleKeyDown("ArrowDown");
    input.handleKeyDown("ArrowLeft");
    input.handleKeyDown("ArrowRight");
    expect(input.up).toBe(true);
    expect(input.down).toBe(true);
    expect(input.left).toBe(true);
    expect(input.right).toBe(true);
  });

  it("releasing a key sets direction to false", () => {
    const input = new InputHandler();
    input.handleKeyDown("w");
    expect(input.up).toBe(true);
    input.handleKeyUp("w");
    expect(input.up).toBe(false);
  });

  it("ignores unmapped keys", () => {
    const input = new InputHandler();
    input.handleKeyDown("q");
    expect(input.up).toBe(false);
    expect(input.down).toBe(false);
    expect(input.left).toBe(false);
    expect(input.right).toBe(false);
  });

  it("clearAll releases all directions", () => {
    const input = new InputHandler();
    input.handleKeyDown("w");
    input.handleKeyDown("a");
    input.handleKeyDown("s");
    input.handleKeyDown("d");
    input.clearAll();
    expect(input.up).toBe(false);
    expect(input.down).toBe(false);
    expect(input.left).toBe(false);
    expect(input.right).toBe(false);
  });

  it("handles simultaneous keys (diagonal)", () => {
    const input = new InputHandler();
    input.handleKeyDown("w");
    input.handleKeyDown("d");
    expect(input.up).toBe(true);
    expect(input.right).toBe(true);
    expect(input.down).toBe(false);
    expect(input.left).toBe(false);
  });
});

describe("InputState interface", () => {
  it("can be satisfied by a plain object (testability proof)", () => {
    const fakeInput: InputState = {
      up: true,
      down: false,
      left: false,
      right: false,
    };
    expect(fakeInput.up).toBe(true);
  });
});
