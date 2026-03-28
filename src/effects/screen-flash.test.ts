import { describe, it, expect, vi } from "vitest";
import { ScreenFlash } from "./screen-flash";

function mockCtx(): CanvasRenderingContext2D {
  return {
    globalAlpha: 1,
    fillStyle: "",
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("ScreenFlash", () => {
  it("starts inactive", () => {
    const flash = new ScreenFlash();
    expect(flash.isActive).toBe(false);
  });

  it("trigger activates flash", () => {
    const flash = new ScreenFlash();
    flash.trigger("#f00", 0.2);
    expect(flash.isActive).toBe(true);
  });

  it("decays to inactive", () => {
    const flash = new ScreenFlash();
    flash.trigger("#f00", 0.2);
    flash.update(0.3);
    expect(flash.isActive).toBe(false);
  });

  it("render does not throw when active", () => {
    const flash = new ScreenFlash();
    flash.trigger("#f00", 0.2);
    expect(() => flash.render(mockCtx(), 800, 600)).not.toThrow();
  });

  it("render does not throw when inactive", () => {
    const flash = new ScreenFlash();
    expect(() => flash.render(mockCtx(), 800, 600)).not.toThrow();
  });

  it("new trigger overrides previous", () => {
    const flash = new ScreenFlash();
    flash.trigger("#f00", 0.2);
    flash.update(0.1);
    flash.trigger("#0f0", 0.5);
    expect(flash.isActive).toBe(true);
  });
});
