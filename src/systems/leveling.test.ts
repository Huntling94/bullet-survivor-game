import { describe, it, expect } from "vitest";
import { LevelingSystem, UPGRADES, UpgradeDefinition } from "./leveling";
import { Player } from "../entities/player";
import { DEFAULT_WEAPON_STATS, WeaponStats } from "../entities/weapon";

function freshWeaponStats(): WeaponStats {
  return { ...DEFAULT_WEAPON_STATS };
}

function findUpgrade(id: string): UpgradeDefinition {
  const upgrade = UPGRADES.find((u) => u.id === id);
  if (!upgrade) throw new Error(`Upgrade ${id} not found`);
  return upgrade;
}

describe("LevelingSystem", () => {
  it("starts at level 1 with 0 XP", () => {
    const leveling = new LevelingSystem();
    expect(leveling.level).toBe(1);
    expect(leveling.currentXp).toBe(0);
  });

  it("xpToNextLevel is 10 + level * 10", () => {
    const leveling = new LevelingSystem();
    expect(leveling.xpToNextLevel).toBe(20); // 10 + 1*10
  });

  it("xpProgress starts at 0", () => {
    const leveling = new LevelingSystem();
    expect(leveling.xpProgress).toBe(0);
  });

  it("addXp accumulates", () => {
    const leveling = new LevelingSystem();
    leveling.addXp(5);
    expect(leveling.currentXp).toBe(5);
    expect(leveling.xpProgress).toBeCloseTo(0.25);
  });

  it("addXp returns false when not leveled up", () => {
    const leveling = new LevelingSystem();
    expect(leveling.addXp(5)).toBe(false);
  });

  it("addXp returns true on level up", () => {
    const leveling = new LevelingSystem();
    expect(leveling.addXp(20)).toBe(true);
    expect(leveling.level).toBe(2);
  });

  it("carries over excess XP on level up", () => {
    const leveling = new LevelingSystem();
    leveling.addXp(25); // needs 20, excess 5
    expect(leveling.level).toBe(2);
    expect(leveling.currentXp).toBe(5);
  });

  it("xpToNextLevel increases each level", () => {
    const leveling = new LevelingSystem();
    leveling.addXp(20); // level up to 2
    expect(leveling.xpToNextLevel).toBe(30); // 10 + 2*10
  });

  it("generateChoices returns 3 upgrades", () => {
    const leveling = new LevelingSystem();
    const choices = leveling.generateChoices();
    expect(choices.length).toBe(3);
  });

  it("generateChoices returns no duplicates", () => {
    const leveling = new LevelingSystem();
    const choices = leveling.generateChoices();
    const ids = choices.map((c) => c.id);
    expect(new Set(ids).size).toBe(3);
  });

  it("applyUpgrade modifies weapon stats", () => {
    const leveling = new LevelingSystem();
    const player = new Player();
    const stats = freshWeaponStats();
    const originalDamage = stats.damage;

    const damageUpgrade = findUpgrade("damage");
    leveling.pendingUpgradeChoices = [
      damageUpgrade,
      damageUpgrade,
      damageUpgrade,
    ];
    leveling.applyUpgrade(0, player, stats);
    expect(stats.damage).toBe(originalDamage + 5);
  });

  it("applyUpgrade modifies player stats", () => {
    const leveling = new LevelingSystem();
    const player = new Player();
    const stats = freshWeaponStats();
    const originalSpeed = player.speed;

    const speedUpgrade = findUpgrade("speed");
    leveling.pendingUpgradeChoices = [speedUpgrade, speedUpgrade, speedUpgrade];
    leveling.applyUpgrade(0, player, stats);
    expect(player.speed).toBeCloseTo(originalSpeed * 1.15);
  });

  it("applyUpgrade clears pending choices", () => {
    const leveling = new LevelingSystem();
    const player = new Player();
    const stats = freshWeaponStats();

    leveling.pendingUpgradeChoices = leveling.generateChoices();
    leveling.applyUpgrade(0, player, stats);
    expect(leveling.pendingUpgradeChoices).toBe(null);
  });

  it("applyUpgrade is no-op without pending choices", () => {
    const leveling = new LevelingSystem();
    const player = new Player();
    const stats = freshWeaponStats();
    const originalDamage = stats.damage;

    leveling.applyUpgrade(0, player, stats);
    expect(stats.damage).toBe(originalDamage);
  });

  it("vitality upgrade heals player", () => {
    const leveling = new LevelingSystem();
    const player = new Player();
    player.health = 50;
    const stats = freshWeaponStats();

    const vitalityUpgrade = findUpgrade("max_health");
    leveling.pendingUpgradeChoices = [
      vitalityUpgrade,
      vitalityUpgrade,
      vitalityUpgrade,
    ];
    leveling.applyUpgrade(0, player, stats);
    expect(player.maxHealth).toBe(125);
    expect(player.health).toBe(75);
  });
});
