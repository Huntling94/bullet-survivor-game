# BRF-007: Polish — Enemy Variety, Wave Scaling, Game Over Restart

## 1. Objective

**What it delivers:** Two new enemy types (Tank, Swarm), per-wave stat scaling so late game is harder, and R-to-restart on game over. The game feels complete.

**Why now:** Final step. The core loop works (F-001–F-004), progression works (F-005), juice works (F-006). Now we add the variety and polish that makes it replayable.

### New enemy types

| Type      | Speed   | Radius | HP      | Damage | XP    | Color      | Introduced | Role                           |
| --------- | ------- | ------ | ------- | ------ | ----- | ---------- | ---------- | ------------------------------ |
| Shambler  | 60      | 12     | 30      | 10     | 3     | Red        | Wave 1     | Baseline pressure              |
| Runner    | 120     | 8      | 15      | 5      | 1     | Orange     | Wave 2     | Speed threat                   |
| **Swarm** | **150** | **5**  | **8**   | **3**  | **1** | **Green**  | **Wave 3** | Screen clutter, rewards pierce |
| **Tank**  | **40**  | **18** | **100** | **20** | **8** | **Purple** | **Wave 4** | HP wall, forces sustained fire |

## 2. Design decisions

### DD-1: New types via config only (no class changes)

- **Decision:** Extend `EnemyType` union, add entries to `ENEMY_CONFIGS`. Enemy class unchanged.
- **Rationale:** The data-driven pattern from F-003 pays off — adding a type is adding a config object, not code. This is the whole point of data-driven entities.

### DD-2: Swarm spawns in clusters of 3–5

- **Decision:** When spawner picks "swarm", it pushes 3–5 instructions at nearly the same position (±20px random offset).
- **Rationale:** A single swarm enemy is uninteresting. A cluster of 3–5 tiny fast enemies creates the "swarm" feel and rewards pierce upgrades.

### DD-3: Wave stat scaling via statScale multiplier

- **Decision:** `statScale = 1 + (waveNumber - 1) * 0.05`. Applied to maxHealth and speed. Damage stays flat.
- **Rationale:** Wave 10 enemies have 1.45× HP and speed — noticeable but not overwhelming. Damage stays flat because player HP doesn't scale proportionally (only via Vitality upgrades) and i-frames already gate damage.

### DD-4: Restart via reset() methods (not reconstruction)

- **Decision:** Each subsystem gets a `reset()` method. Game.reset() calls them all. Press R on game over.
- **Rationale:** `player`, `weapon`, etc. are `readonly` fields — we can't replace them. reset() methods keep the readonly contract and make each class responsible for its own initialization. Cleaner than exposing mutable references.

## 3. Implementation plan

### Commit 1: `add tank and swarm enemy types with cluster spawning`

- `src/entities/enemy.ts` — extend type union + configs
- `src/systems/spawner.ts` — introduction waves, probabilities, cluster spawning
- Tests for both

### Commit 2: `add per-wave stat scaling for enemy health and speed`

- `src/systems/spawner.ts` — statScale on SpawnInstruction
- `src/entities/enemy.ts` — constructor accepts statScale, instance speed field
- `src/game.ts` — pass statScale when creating enemies
- Tests

### Commit 3: `add R-to-restart with reset methods on all subsystems`

- reset() on Player, Weapon, Spawner, LevelingSystem, Camera, Game
- R key handler in game over state
- Update game over text
- Tests

## 4. Solution design

### New configs (src/entities/enemy.ts)

```typescript
type EnemyType = "shambler" | "runner" | "tank" | "swarm";

ENEMY_CONFIGS = {
  shambler: {
    speed: 60,
    radius: 12,
    maxHealth: 30,
    damage: 10,
    xpValue: 3,
    color: "#e53935",
  },
  runner: {
    speed: 120,
    radius: 8,
    maxHealth: 15,
    damage: 5,
    xpValue: 1,
    color: "#ff9800",
  },
  tank: {
    speed: 40,
    radius: 18,
    maxHealth: 100,
    damage: 20,
    xpValue: 8,
    color: "#7b1fa2",
  },
  swarm: {
    speed: 150,
    radius: 5,
    maxHealth: 8,
    damage: 3,
    xpValue: 1,
    color: "#66bb6a",
  },
};
```

### Enemy constructor with scaling

```typescript
constructor(position: Vector2, config: EnemyConfig, statScale: number = 1) {
  this.speed = config.speed * statScale;
  this.maxHealth = Math.round(config.maxHealth * statScale);
  this.health = this.maxHealth;
  // radius, damage, color, xpValue stay at base values
}
```

### Spawner type selection (simplified)

```typescript
pickEnemyType(): { type: EnemyType; count: number } {
  // Roll for tank first (low chance, high impact)
  if (wave >= 4 && random < tankChance) return { type: "tank", count: 1 };
  // Then swarm (cluster)
  if (wave >= 3 && random < swarmChance) return { type: "swarm", count: 3 + floor(random * 3) };
  // Then runner
  if (wave >= 2 && random < runnerChance) return { type: "runner", count: 1 };
  // Default
  return { type: "shambler", count: 1 };
}
```

### Game.reset()

```typescript
reset(): void {
  this.player.reset();
  this.weapon.reset();
  this.spawner.reset();
  this.leveling.reset();
  this.camera.reset();
  this.enemies = [];
  this.projectilePool.clear();
  this.gemPool.clear();
  this.particles.clear();     // need to add clear() to ParticleSystem
  this.damageNumbers.clear(); // need to add clear() to DamageNumberSystem
  this.gameOver = false;
  this.paused = false;
  this.survivalTime = 0;
  this.freezeTimer = 0;
  this.previousWaveNumber = 1;
  this.waveTextTimer = 0;
  this.xpBarFlashTimer = 0;
}
```

## 5. Acceptance criteria

- [ ] Tank enemies appear from wave 4 (large purple, slow, tanky)
- [ ] Swarm enemies appear from wave 3 (small green, fast, in clusters of 3-5)
- [ ] Enemy HP and speed scale with wave number (~5% per wave)
- [ ] Late-game waves feel meaningfully harder
- [ ] Press R on game over to restart (full state reset)
- [ ] Game over text shows "Press R to restart"
- [ ] Restart resets player stats (including upgrades), wave, level, enemies
- [ ] All tests pass
- [ ] All pre-commit gates pass
