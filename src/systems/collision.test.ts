import { describe, it, expect } from "vitest";
import {
  circlesOverlap,
  checkPlayerEnemyCollisions,
  findNearestEnemy,
  checkProjectileEnemyCollisions,
} from "./collision";
import { Vector2 } from "../utils/vector2";
import { Player } from "../entities/player";
import { Enemy, ENEMY_CONFIGS } from "../entities/enemy";
import { Projectile, DEFAULT_PROJECTILE_CONFIG } from "../entities/projectile";

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
    expect(player.health).toBe(
      player.maxHealth - ENEMY_CONFIGS.shambler.damage,
    );
  });
});

describe("findNearestEnemy", () => {
  it("returns closest enemy", () => {
    const far = new Enemy(new Vector2(100, 0), ENEMY_CONFIGS.shambler);
    const near = new Enemy(new Vector2(20, 0), ENEMY_CONFIGS.shambler);
    const result = findNearestEnemy(Vector2.ZERO, [far, near]);
    expect(result).toBe(near);
  });

  it("skips inactive enemies", () => {
    const near = new Enemy(new Vector2(10, 0), ENEMY_CONFIGS.shambler);
    near.active = false;
    const far = new Enemy(new Vector2(100, 0), ENEMY_CONFIGS.shambler);
    const result = findNearestEnemy(Vector2.ZERO, [near, far]);
    expect(result).toBe(far);
  });

  it("returns null for empty array", () => {
    expect(findNearestEnemy(Vector2.ZERO, [])).toBe(null);
  });

  it("returns null when all enemies inactive", () => {
    const enemy = new Enemy(new Vector2(10, 0), ENEMY_CONFIGS.shambler);
    enemy.active = false;
    expect(findNearestEnemy(Vector2.ZERO, [enemy])).toBe(null);
  });
});

describe("checkProjectileEnemyCollisions", () => {
  it("damages enemy on overlap", () => {
    const p = new Projectile();
    p.activate(Vector2.ZERO, new Vector2(1, 0), DEFAULT_PROJECTILE_CONFIG, 1);
    const enemy = new Enemy(new Vector2(2, 0), ENEMY_CONFIGS.shambler);
    // projectile radius 4 + enemy radius 12 = 16 > distance 2
    checkProjectileEnemyCollisions([p], [enemy]);
    expect(enemy.health).toBe(
      ENEMY_CONFIGS.shambler.maxHealth - DEFAULT_PROJECTILE_CONFIG.damage,
    );
    expect(p.active).toBe(false); // pierce = 1, deactivated
  });

  it("pierce lets projectile hit multiple enemies", () => {
    const p = new Projectile();
    p.activate(Vector2.ZERO, new Vector2(1, 0), DEFAULT_PROJECTILE_CONFIG, 3);
    const e1 = new Enemy(new Vector2(2, 0), ENEMY_CONFIGS.shambler);
    const e2 = new Enemy(new Vector2(3, 0), ENEMY_CONFIGS.shambler);
    checkProjectileEnemyCollisions([p], [e1, e2]);
    expect(e1.health).toBe(20);
    expect(e2.health).toBe(20);
    expect(p.active).toBe(true); // pierce started at 3, hit 2
  });

  it("skips inactive projectiles", () => {
    const p = new Projectile();
    // Not activated, so inactive
    const enemy = new Enemy(Vector2.ZERO, ENEMY_CONFIGS.shambler);
    checkProjectileEnemyCollisions([p], [enemy]);
    expect(enemy.health).toBe(ENEMY_CONFIGS.shambler.maxHealth);
  });

  it("skips inactive enemies", () => {
    const p = new Projectile();
    p.activate(Vector2.ZERO, new Vector2(1, 0), DEFAULT_PROJECTILE_CONFIG, 1);
    const enemy = new Enemy(new Vector2(2, 0), ENEMY_CONFIGS.shambler);
    enemy.active = false;
    checkProjectileEnemyCollisions([p], [enemy]);
    expect(p.active).toBe(true); // didn't hit anything
  });
});
