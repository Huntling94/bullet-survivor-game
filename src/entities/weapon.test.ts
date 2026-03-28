import { describe, it, expect } from "vitest";
import { Weapon, DEFAULT_WEAPON_STATS } from "./weapon";

describe("Weapon", () => {
  it("can fire immediately", () => {
    const weapon = new Weapon();
    expect(weapon.canFire()).toBe(true);
  });

  it("cannot fire after resetFireTimer", () => {
    const weapon = new Weapon();
    weapon.resetFireTimer();
    expect(weapon.canFire()).toBe(false);
  });

  it("can fire again after fire rate elapses", () => {
    const weapon = new Weapon();
    weapon.resetFireTimer();
    weapon.update(DEFAULT_WEAPON_STATS.fireRate + 0.01);
    expect(weapon.canFire()).toBe(true);
  });

  it("cannot fire before fire rate elapses", () => {
    const weapon = new Weapon();
    weapon.resetFireTimer();
    weapon.update(DEFAULT_WEAPON_STATS.fireRate - 0.1);
    expect(weapon.canFire()).toBe(false);
  });

  it("uses default stats", () => {
    const weapon = new Weapon();
    expect(weapon.stats.fireRate).toBe(0.4);
    expect(weapon.stats.damage).toBe(10);
    expect(weapon.stats.pierce).toBe(1);
  });

  it("accepts custom stats", () => {
    const weapon = new Weapon({
      ...DEFAULT_WEAPON_STATS,
      fireRate: 0.1,
      damage: 50,
    });
    expect(weapon.stats.fireRate).toBe(0.1);
    expect(weapon.stats.damage).toBe(50);
  });
});
