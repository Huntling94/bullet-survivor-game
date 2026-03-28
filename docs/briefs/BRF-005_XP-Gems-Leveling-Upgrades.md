# BRF-005: XP Gems, Leveling, and Upgrade Selection

## 1. Objective

**What it delivers:** Killed enemies drop XP gems that magnetically fly toward the player. Collecting XP fills a bar. When the bar fills, the game pauses and presents 3 random upgrade choices. Picking one modifies weapon or player stats. The game now has progression — each run builds differently.

**What it doesn't:** No visual juice on pickup/level-up (F-006). No enemy variety beyond shambler/runner (F-007).

**Why now:** Step 5 of the implementation order. The core loop (move, dodge, kill) works, but every run plays identically. Upgrades create build diversity — "do I stack damage or invest in pierce?" — which is what makes survivors-likes replayable.

### New concepts introduced

| Concept                             | What it is                                          | Why it matters                                                                                                                                                                                                          |
| ----------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Magnetic pickup**                 | Gems accelerate toward the player when within range | Instant-contact pickup requires tedious precision. Magnetic pull creates a satisfying "vacuum" effect and lets you focus on dodging, not collecting. The acceleration curve (faster when closer) creates a "snap" feel. |
| **XP/leveling curve**               | XP threshold increases each level                   | Linear curve: `10 + level × 10`. Level 1 needs 20 XP (~7 shamblers). Gradual escalation means early levels come fast (dopamine), later levels require more killing (tension).                                           |
| **Upgrade system**                  | Mutable stats modified by player choice             | The payoff of F-004's `WeaponStats` design. Upgrades are just `stats.damage += 5`. No structural changes — just numbers going up. This is why we made weapon stats mutable.                                             |
| **Game pause state**                | Freezing gameplay to present choices                | A separate state from gameOver. Update skips, render still runs (so you see the frozen game behind the upgrade UI). Teaches the concept of game states beyond running/stopped.                                          |
| **Killed vs despawned distinction** | Knowing _why_ an entity was removed                 | Killed enemies drop gems. Despawned enemies (too far away) don't. A `killed` flag on Enemy distinguishes the two causes. Same pattern reused for death particles in F-006.                                              |

## 2. Design decisions

### DD-1: Canvas-rendered upgrade UI (not HTML/CSS overlay)

- **Problem:** CLAUDE.md architecture says `ui/ — HUD overlay (HTML/CSS, not canvas)`. Should the level-up panel be HTML?
- **Decision:** Canvas-rendered. Three upgrade cards drawn on the canvas during the paused state.
- **Rationale:** The entire game renders to canvas. Adding HTML/CSS introduces z-index layering, pointer events, CSS animations, and DOM testing complexity. Canvas rendering is consistent with everything else, keeps all rendering in one system, and is how most actual games handle menus. Keys 1/2/3 for selection avoids mouse handling complexity.
- **Consequence:** No `src/ui/` directory needed yet. Upgrade cards rendered in `Game.render()`.

### DD-2: Magnetic pickup with acceleration curve

- **Problem:** How should gem collection work?
- **Decision:** Two radii — a small "collect radius" (24px, instant pickup) and a larger "magnetic radius" (100px, upgradeable, pulls gems toward player). Magnetic pull strength increases as distance decreases: `speed × (magnetRadius / dist)`.
- **Rationale:** The `1/dist` factor creates a "snap" — gems drift slowly at the edge of the magnetic radius then accelerate sharply as they approach. This feels satisfying because the visual acceleration matches the player's expectation of "almost got it → got it!" Constant-speed magnets feel sluggish by comparison.
- **Consequence:** Player gains a `pickupRadius` property (the magnetic radius). Gem.update() handles both magnetic pull and collection in one pass.

### DD-3: One gem per enemy, XP value varies by type

- **Problem:** How many gems per kill? What sizes?
- **Decision:** Each enemy drops exactly one gem. Shambler = 3 XP, Runner = 1 XP. Three visual tiers by XP value (1 = small green, 5 = medium blue, 25 = large purple) — future enemy types can drop higher-value gems.
- **Rationale:** One gem per kill avoids gem spam. Varying XP by enemy type creates a natural incentive to engage harder enemies (shamblers are worth more but dangerous). The three visual tiers are ready for future enemy types without code changes.
- **Consequence:** Add `xpValue` to `EnemyConfig`. Gem pools shared across all tiers (same class, different config).

### DD-4: Stackable upgrades with simple random selection

- **Problem:** One-time upgrades or stackable? How to select what's offered?
- **Decision:** All upgrades are stackable (can be picked multiple times). On level-up, pick 3 random upgrades from the pool with no duplicates in one offering, but the same upgrade can appear across multiple level-ups.
- **Rationale:** Stackable upgrades are core to the survivors-like genre. Stacking damage 5 times for +25 damage is a valid (and fun) strategy. No-duplicates-per-offering ensures meaningful choice. Across level-ups, repeats are expected — "do I double down on damage or diversify?"
- **Consequence:** Upgrade pool is a flat array. `generateChoices()` shuffles and picks 3.

### DD-5: Player stats refactored to mutable instance properties

- **Problem:** `PLAYER_SPEED` and `PLAYER_MAX_HEALTH` are file-level constants. Upgrades can't modify them.
- **Decision:** Add `speed` and `pickupRadius` as mutable instance properties. Remove `readonly` from `maxHealth`. File-level constants become defaults.
- **Rationale:** Minimal refactor. `update()` already references `this.maxHealth` for rendering. Changing `PLAYER_SPEED` to `this.speed` is one line. Tests still work because default values match the old constants.
- **Consequence:** Player has three upgrade-target properties: `speed`, `maxHealth`, `pickupRadius`.

### DD-6: Enemy `killed` flag for drop detection

- **Problem:** Both killed enemies and despawned enemies have `active = false`. How do we know which should drop gems?
- **Decision:** Add `killed: boolean` to Enemy. `takeDamage()` sets it when health reaches 0. Game checks this before filtering inactive enemies.
- **Rationale:** Clean separation of concerns. The flag is set at the point of death, checked at the point of gem spawning, and implicitly cleared when the enemy is removed from the array. Same pattern reused for death particles in F-006.
- **Consequence:** One boolean property, one line in `takeDamage()`, one loop in Game.

### DD-7: Key-based upgrade selection (1/2/3)

- **Problem:** How does the player select an upgrade during pause?
- **Decision:** Press 1, 2, or 3 on the keyboard. Add a `onKeyDown` callback to InputHandler.
- **Rationale:** Keyboard selection avoids mouse/click handling complexity. Keys 1/2/3 are intuitive and match the visual layout (three cards). The callback pattern keeps Game decoupled from DOM events — same testability pattern as InputState.
- **Consequence:** InputHandler gains `onKeyDown(callback)`. Game registers a callback that checks for "1"/"2"/"3" during paused state.

## 3. File changes

| File                           | Action | What it does                           | Risk                  |
| ------------------------------ | ------ | -------------------------------------- | --------------------- |
| `src/entities/player.ts`       | Modify | Mutable speed, pickupRadius, maxHealth | Low                   |
| `src/entities/player.test.ts`  | Modify | Test mutable stats                     | Low                   |
| `src/entities/enemy.ts`        | Modify | Add killed flag, xpValue to config     | Low                   |
| `src/entities/enemy.test.ts`   | Modify | Test killed flag                       | Low                   |
| `src/entities/xp-gem.ts`       | Create | XpGem with magnetic pickup             | Medium                |
| `src/entities/xp-gem.test.ts`  | Create | Pull, collection, deactivation tests   | Low                   |
| `src/systems/leveling.ts`      | Create | LevelingSystem, upgrade definitions    | Medium                |
| `src/systems/leveling.test.ts` | Create | XP tracking, level-up, upgrades        | Low                   |
| `src/systems/input.ts`         | Modify | Add onKeyDown callback                 | Low                   |
| `src/systems/input.test.ts`    | Modify | Test callback                          | Low                   |
| `src/game.ts`                  | Modify | Integrate gems, leveling, pause, UI    | High — largest change |
| `src/game.test.ts`             | Modify | Integration tests                      | Medium                |

## 4. Implementation plan

### Commit 1: `refactor player to use mutable instance stats for upgrades`

- `src/entities/player.ts` — mutable speed, pickupRadius, remove readonly from maxHealth
- `src/entities/player.test.ts` — test mutable speed affects movement

### Commit 2: `add killed flag and xpValue to enemy for gem drops`

- `src/entities/enemy.ts` — killed flag in takeDamage, xpValue in config
- `src/entities/enemy.test.ts` — killed on death, not on despawn

### Commit 3: `add XP gem entity with magnetic pickup behavior`

- `src/entities/xp-gem.ts` — poolable gem with magnetic pull + collection
- `src/entities/xp-gem.test.ts` — pull, collect, despawn tests

### Commit 4: `add leveling system with XP tracking and upgrade definitions`

- `src/systems/leveling.ts` — LevelingSystem, UPGRADES, XP curve
- `src/systems/leveling.test.ts` — XP, level-up, choices, apply

### Commit 5: `add key callback support to input handler`

- `src/systems/input.ts` — onKeyDown callback
- `src/systems/input.test.ts` — callback fires

### Commit 6: `integrate XP gems, leveling, and upgrade UI into game`

- `src/game.ts` — gem pool, leveling, pause, gem spawn/collect, upgrade UI render, XP bar
- `src/game.test.ts` — integration tests

## 5. Test strategy

| What                        | How                                               | Why                   |
| --------------------------- | ------------------------------------------------- | --------------------- |
| Player.speed modifiable     | Set speed=400, update 1s, check position          | Upgrade target works  |
| Enemy.killed on death       | takeDamage(maxHealth), check killed=true          | Gem drop trigger      |
| Enemy.killed not on despawn | active=false directly, killed=false               | No gems from despawns |
| Gem magnetic pull           | Gem at 80px (< 100px radius), update, closer      | Magnet works          |
| Gem collection              | Gem at 20px (< 24px collect radius), returns true | Pickup works          |
| Gem no pull outside radius  | Gem at 200px, no movement                         | Radius respected      |
| XP accumulation             | Add 5 + 5, currentXp = 10                         | Tracking works        |
| Level-up triggers           | Add enough XP, level increments, returns true     | Trigger works         |
| XP overflow                 | Add 50 when 20 needed, excess carried over        | No lost XP            |
| 3 unique choices            | Generate, check length 3, no dupes                | Correct offering      |
| Upgrade applies             | Apply "damage", weapon.stats.damage increased     | Upgrades work         |
| Kill → gem spawn            | Kill enemy in game, gemPool.activeLength > 0      | Integration           |
| Collect → XP                | Gem at player pos, update, check XP               | Integration           |
| Level-up → pause            | Enough XP, game.paused = true                     | Pause works           |
| Key 1 → resume              | Pause + key "1", game.paused = false              | Resume works          |

## 6. Risks & mitigations

| Risk                                  | Severity | Likelihood | Mitigation                                                        |
| ------------------------------------- | -------- | ---------- | ----------------------------------------------------------------- |
| Player refactor breaks movement tests | Medium   | Medium     | Small change — add properties, use them. Run tests after commit 1 |
| Gem pool unbounded in long games      | Low      | Medium     | Despawn gems beyond despawn radius, same as enemies               |
| Upgrade balance is off                | Low      | High       | All constants named, easy to tune                                 |
| Level-up UI blocks permanently        | Medium   | Low        | Guard: if no choices, auto-unpause                                |
| XP curve too fast/slow                | Low      | High       | Linear formula with named constants, easy to adjust               |

## 7. Solution design

### Interfaces and types

```typescript
// src/entities/xp-gem.ts
class XpGem implements Entity {
  position: Vector2;
  radius: number;
  active: boolean;
  xpValue: number;

  activate(position: Vector2, xpValue: number): void;
  deactivate(): void;
  update(dt: number, playerPos: Vector2, magnetRadius: number): boolean;
  // Returns true if collected (within collect radius)
  // Applies magnetic acceleration when within magnetRadius
  render(ctx: CanvasRenderingContext2D): void;
}

// src/systems/leveling.ts
interface UpgradeDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly apply: (player: Player, weaponStats: WeaponStats) => void;
}

class LevelingSystem {
  level: number;
  currentXp: number;
  pendingUpgradeChoices: UpgradeDefinition[] | null;

  get xpToNextLevel(): number; // 10 + level * 10
  get xpProgress(): number; // 0..1

  addXp(amount: number): boolean; // returns true if leveled up
  generateChoices(): UpgradeDefinition[]; // 3 random, no dupes
  applyUpgrade(index: number, player: Player, weaponStats: WeaponStats): void;
}
```

### Key logic: magnetic pickup (src/entities/xp-gem.ts)

```typescript
update(dt: number, playerPos: Vector2, magnetRadius: number): boolean {
  if (!this.active) return false;

  const dist = this.position.distanceTo(playerPos);

  // Instant collection
  if (dist < COLLECT_RADIUS) return true;

  // Magnetic pull (accelerates as gem gets closer)
  if (dist < magnetRadius) {
    const direction = playerPos.subtract(this.position).normalize();
    const pullStrength = MAGNET_SPEED * (magnetRadius / dist);
    this.position = this.position.add(direction.scale(pullStrength * dt));
  }

  return false;
}
```

### Key logic: upgrade application (src/systems/leveling.ts)

```typescript
const UPGRADES: UpgradeDefinition[] = [
  {
    id: "damage",
    name: "Damage+",
    desc: "+5 damage",
    apply: (_p, w) => {
      w.damage += 5;
    },
  },
  {
    id: "fire_rate",
    name: "Fire Rate+",
    desc: "-15% fire delay",
    apply: (_p, w) => {
      w.fireRate *= 0.85;
    },
  },
  {
    id: "pierce",
    name: "Pierce+",
    desc: "+1 pierce",
    apply: (_p, w) => {
      w.pierce += 1;
    },
  },
  {
    id: "proj_size",
    name: "Big Shots",
    desc: "+2 projectile size",
    apply: (_p, w) => {
      w.projectileRadius += 2;
    },
  },
  {
    id: "speed",
    name: "Speed+",
    desc: "+15% move speed",
    apply: (p) => {
      p.speed *= 1.15;
    },
  },
  {
    id: "magnet",
    name: "Magnet+",
    desc: "+30% pickup radius",
    apply: (p) => {
      p.pickupRadius *= 1.3;
    },
  },
  {
    id: "max_health",
    name: "Vitality+",
    desc: "+25 max HP (heals)",
    apply: (p) => {
      p.maxHealth += 25;
      p.health += 25;
    },
  },
];
```

### Key logic: game update loop additions

```typescript
// After projectile-enemy collision, before removing inactive enemies:
for (const enemy of this.enemies) {
  if (enemy.killed) {
    const gem = this.gemPool.acquire();
    gem.activate(enemy.position, enemy.config.xpValue);
  }
}

// After removing inactive enemies:
for (const gem of [...this.gemPool.getActive()]) {
  if (gem.update(dt, this.player.position, this.player.pickupRadius)) {
    // Collected
    const leveledUp = this.leveling.addXp(gem.xpValue);
    this.gemPool.release(gem);
    if (leveledUp) {
      this.leveling.pendingUpgradeChoices = this.leveling.generateChoices();
      this.paused = true;
    }
  } else if (!gem.active) {
    this.gemPool.release(gem);
  }
}
```

### Render additions

```typescript
// World space: gems between projectiles and enemies
for (const gem of this.gemPool.getActive()) {
  gem.render(ctx);
}

// Screen space: XP bar at bottom
const barWidth = this.width * 0.6;
const barX = (this.width - barWidth) / 2;
const barY = this.height - 30;
ctx.fillStyle = "#333";
ctx.fillRect(barX, barY, barWidth, 8);
ctx.fillStyle = "#7c4dff";
ctx.fillRect(barX, barY, barWidth * this.leveling.xpProgress, 8);
ctx.fillText(`Lv ${this.leveling.level}`, barX - 40, barY);

// Pause overlay: 3 upgrade cards
if (this.paused && this.leveling.pendingUpgradeChoices) {
  // Semi-transparent overlay
  // Three cards centered, each showing name + description + key (1/2/3)
}
```

## 8. Acceptance criteria

- [ ] Killed enemies drop XP gems at their death position
- [ ] XP gems magnetically fly toward player when within pickup radius
- [ ] XP gems are collected on contact with player
- [ ] XP bar visible at bottom of screen, fills on collection
- [ ] Level-up pauses the game and shows 3 upgrade choices
- [ ] Keys 1/2/3 select an upgrade
- [ ] Selected upgrade modifies weapon or player stats
- [ ] Game resumes after upgrade selection
- [ ] Upgrades are stackable (same upgrade offered again later)
- [ ] Despawned enemies (too far) do not drop gems
- [ ] XP gems use object pool (no continuous allocation)
- [ ] All tests pass (`npm test`)
- [ ] All pre-commit gates pass
- [ ] `npm run build` succeeds

## 9. How this sets up F-006

1. **`killed` flag** — F-006 hooks death particles and screen shake to the same flag
2. **Level-up pause** — F-006 adds screen flash and time freeze (0.3s) before the pause
3. **Gem collection** — F-006 adds scale-pulse on absorb and XP bar flash
4. **Upgrade application** — F-006 adds visual feedback when stats change
