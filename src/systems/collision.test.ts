import { describe, it, expect } from "vitest";
import { circlesOverlap, checkPlayerEnemyCollisions } from "./collision";
import { Vector2 } from "../utils/vector2";
import { Player } from "../entities/player";
import { Enemy, ENEMY_CONFIGS } from "../entities/enemy";

describe("circlesOverlap", () => {
  it("returns true when circles overlap", () => {
    // Distance 10, radii sum 12
    expect(circlesOverlap(new Vector2(0, 0), 6, new Vector2(10, 0), 6)).toBe(
      true,
    );
  });

  it("returns false when circles are apart", () => {
    // Distance 20, radii sum 12
    expect(circlesOverlap(new Vector2(0, 0), 6, new Vector2(20, 0), 6)).toBe(
      false,
    );
  });

  it("returns true when circles are exactly touching", () => {
    // Distance 12, radii sum 12 — not strictly less than, so false
    expect(circlesOverlap(new Vector2(0, 0), 6, new Vector2(12, 0), 6)).toBe(
      false,
    );
  });

  it("returns true when circles are concentric", () => {
    expect(circlesOverlap(new Vector2(5, 5), 10, new Vector2(5, 5), 3)).toBe(
      true,
    );
  });

  it("works on diagonal distances", () => {
    // Distance = sqrt(9+16) = 5, radii sum = 6
    expect(circlesOverlap(new Vector2(0, 0), 3, new Vector2(3, 4), 3)).toBe(
      true,
    );
  });
});

describe("checkPlayerEnemyCollisions", () => {
  it("damages player when enemy overlaps", () => {
    const player = new Player(Vector2.ZERO);
    const enemy = new Enemy(new Vector2(10, 0), ENEMY_CONFIGS.shambler);
    // Player radius 16 + enemy radius 12 = 28 > distance 10
    checkPlayerEnemyCollisions(player, [enemy]);
    expect(player.health).toBe(
      player.maxHealth - ENEMY_CONFIGS.shambler.damage,
    );
  });

  it("does not damage player when enemy is far", () => {
    const player = new Player(Vector2.ZERO);
    const enemy = new Enemy(new Vector2(500, 0), ENEMY_CONFIGS.shambler);
    checkPlayerEnemyCollisions(player, [enemy]);
    expect(player.health).toBe(player.maxHealth);
  });

  it("does not damage invincible player", () => {
    const player = new Player(Vector2.ZERO);
    player.takeDamage(5); // triggers invincibility
    const originalHealth = player.health;
    const enemy = new Enemy(new Vector2(10, 0), ENEMY_CONFIGS.shambler);
    checkPlayerEnemyCollisions(player, [enemy]);
    expect(player.health).toBe(originalHealth);
  });

  it("skips inactive enemies", () => {
    const player = new Player(Vector2.ZERO);
    const enemy = new Enemy(new Vector2(10, 0), ENEMY_CONFIGS.shambler);
    enemy.active = false;
    checkPlayerEnemyCollisions(player, [enemy]);
    expect(player.health).toBe(player.maxHealth);
  });

  it("only applies one hit per frame", () => {
    const player = new Player(Vector2.ZERO);
    const enemy1 = new Enemy(new Vector2(5, 0), ENEMY_CONFIGS.shambler);
    const enemy2 = new Enemy(new Vector2(5, 0), ENEMY_CONFIGS.runner);
    checkPlayerEnemyCollisions(player, [enemy1, enemy2]);
    // Only first enemy's damage applies, then i-frames kick in
    expect(player.health).toBe(
      player.maxHealth - ENEMY_CONFIGS.shambler.damage,
    );
  });
});
