# BRF-003: Enemy Spawning and Wave System

## 1. Objective

**What it delivers:** Enemies that spawn off-screen, walk toward the player, and deal contact damage. A wave system that escalates difficulty over time. The game now has stakes — you can die.

**What it doesn't:** No way to kill enemies (that's F-004, projectiles). Enemies accumulate, so a cap and despawn system keep things playable.

**Why now:** Step 3 of the implementation order. The player can move but there's nothing to move _away from_. Enemies create the core tension that makes movement meaningful.

### New concepts introduced

| Concept                  | What it is                                | Why it matters                                                                                                                                                                                             |
| ------------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Enemy AI**             | Enemies move toward the player each frame | The simplest possible AI: `direction = (player - enemy).normalize()`. Every action game has some form of "move toward target."                                                                             |
| **Invincibility frames** | Brief immunity after taking damage        | Without i-frames, overlapping with an enemy deals damage every frame (60 damage/second at 60fps). I-frames give the player time to react and escape. Every action game from Mario to Dark Souls uses them. |
| **Wave system**          | Difficulty that escalates over time       | Keeps the game from being static. More enemies, faster enemies, new types — the player must constantly adapt. The wave counter also gives a sense of progression ("I survived to wave 8!").                |
| **Spawn positioning**    | Placing enemies outside the viewport      | Enemies spawning visibly on screen looks broken. Spawning on a circle beyond the screen diagonal means they always walk _into_ view naturally.                                                             |
| **Collision detection**  | Circle-circle overlap check               | `distance(a, b) < a.radius + b.radius`. The simplest collision primitive. Works for everything in this game (player, enemies, projectiles, XP gems are all circles).                                       |
| **Data-driven entities** | One class, multiple configurations        | Instead of `ShamberEnemy` and `RunnerEnemy` classes, one `Enemy` class takes a config object. Adding a new type is adding one config entry, not a new class.                                               |
| **Entity interface**     | Shared shape across entity types          | Player and Enemy both have `position`, `radius`, `active`. The collision system works with anything that has these properties — it doesn't care whether it's a player, enemy, or projectile.               |

## 2. Design decisions

### DD-1: Two enemy types from day one (data-driven, not class-per-type)

- **Problem:** One enemy type or multiple? Separate classes or shared class?
- **Decision:** Two types (Shambler: slow+tough, Runner: fast+fragile) via a single `Enemy` class with an `EnemyConfig` parameter.
- **Rationale:** Data-driven entities are standard in game dev. The class defines _behavior_ (move toward player), the config defines _stats_ (speed, health, size, color). Adding a third type is one object literal, not a new file. This is the pattern used by every RPG, every RTS, every survivors-like.
- **Consequence:** `ENEMY_CONFIGS` record at the top of `enemy.ts`. Type-safe via `EnemyType` union.

### DD-2: Continuous spawning with wave milestones

- **Problem:** Distinct waves with pauses, or continuous pressure?
- **Decision:** Continuous spawning that ramps up, with a wave counter that increments every 30 seconds and bumps difficulty.
- **Rationale:** Vampire Survivors uses continuous spawning — the screen is never empty. Pauses between waves break tension and feel like tower defense. The wave counter gives milestone events (for future "Wave 3!" announcements in the juice pass) and a natural difficulty knob.
- **Consequence:** `Spawner` tracks `waveNumber`, `spawnTimer`, and `waveTimer`. Each wave: spawn interval decreases, max enemy count increases, Runners appear from wave 2 onward.

### DD-3: Spawn on a circle outside the viewport

- **Problem:** Where do enemies appear?
- **Decision:** Random point on a circle centered on the player, radius = viewport half-diagonal + buffer.
- **Rationale:** Spawning at screen edges causes visible "popping in." The diagonal calculation guarantees off-screen regardless of angle. Formula: `radius = √(w² + h²) / 2 + margin`.
- **Consequence:** Enemies always walk _into_ view naturally from any direction.

### DD-4: Contact damage with invincibility frames

- **Problem:** What happens when an enemy touches the player?
- **Decision:** Enemy deals its `damage` value once, player enters 1.0s invincibility. During i-frames, player sprite flickers via alpha oscillation.
- **Rationale:** Without i-frames, a single frame of overlap at 60fps deals damage 60 times. I-frames turn "being hit" into a discrete event with visual feedback and a recovery window. This is a universal pattern — Mario, Zelda, Mega Man, Vampire Survivors all use it.
- **Consequence:** Player gains `invincibilityTimer`, `isInvincible` getter, `takeDamage()` method. Collision system checks invincibility before applying damage.

### DD-5: Separate collision system

- **Problem:** Collision logic in `game.ts` or its own module?
- **Decision:** `src/systems/collision.ts` with a reusable `circlesOverlap()` function and a `checkPlayerEnemyCollisions()` function.
- **Rationale:** F-004 adds projectile-enemy collisions, F-005 adds player-gem collisions. All use the same `circlesOverlap()` primitive. Keeping it in one module avoids scattering collision logic across the codebase.
- **Consequence:** `game.ts` calls collision functions in its update loop. New collision types in future features add functions to the same file.

### DD-6: Entity interface (not base class)

- **Problem:** Player and Enemy share properties. Extract a base class?
- **Decision:** Interface only: `{ position: Vector2, radius: number, active: boolean }`. No abstract class.
- **Rationale:** Player.update() takes `InputState`, Enemy.update() takes a `Vector2` target — the signatures differ, so a shared `update()` in a base class would lie about the contract. An interface captures what _is_ shared (things the collision system needs) without forcing what isn't. Zero runtime cost.
- **Consequence:** Collision system operates on any two objects with `position` and `radius`.

### DD-7: Enemy cap + far-enemy despawn (no pooling yet)

- **Problem:** Enemies can't die (no weapons until F-004). They'd accumulate forever.
- **Decision:** Hard cap on active enemies (starts at 30, +5 per wave). Enemies beyond 2× the spawn radius from the player are despawned. No object pooling yet.
- **Rationale:** At 30-50 enemies, `new Enemy()` and array `filter()` are not bottlenecks. Pooling adds complexity (acquire/release lifecycle, reset methods) that would obscure the core patterns being taught. The `active` flag on the Entity interface makes future pool conversion trivial. When F-004 adds rapidly-firing projectiles, we introduce pooling there.
- **Consequence:** Game filters `enemies.filter(e => e.active)` each frame. Spawner checks count before spawning.

## 3. File changes

| File                            | Action | What it does                                    | Risk                       |
| ------------------------------- | ------ | ----------------------------------------------- | -------------------------- |
| `src/entities/types.ts`         | Create | Entity interface (position, radius, active)     | Low                        |
| `src/entities/enemy.ts`         | Create | Enemy class with config-driven types, chase AI  | Low                        |
| `src/entities/enemy.test.ts`    | Create | Movement, config, active flag tests             | Low                        |
| `src/systems/spawner.ts`        | Create | Wave tracking, spawn timing, spawn positioning  | Medium — many tuning knobs |
| `src/systems/spawner.test.ts`   | Create | Wave progression, cap respect, positioning      | Low                        |
| `src/systems/collision.ts`      | Create | Circle overlap, player-enemy collision          | Low                        |
| `src/systems/collision.test.ts` | Create | Geometry, invincibility respect                 | Low                        |
| `src/entities/player.ts`        | Modify | Add damage, invincibility, flicker              | Medium                     |
| `src/entities/player.test.ts`   | Modify | Damage and i-frame tests                        | Low                        |
| `src/game.ts`                   | Modify | Integrate spawner, enemies, collision, wave HUD | Medium                     |
| `src/game.test.ts`              | Modify | Integration tests                               | Low                        |

## 4. Implementation plan

### Commit 1: `add entity interface and player damage with invincibility frames`

- `src/entities/types.ts` — Entity interface
- `src/entities/player.ts` — Add `takeDamage()`, `invincibilityTimer`, `isInvincible`, flicker rendering
- `src/entities/player.test.ts` — Damage, i-frame expiry, health clamping

### Commit 2: `add enemy entity with config-driven types and chase AI`

- `src/entities/enemy.ts` — Enemy class, EnemyConfig, Shambler + Runner configs
- `src/entities/enemy.test.ts` — Movement toward target, speed/config correctness, active flag

### Commit 3: `add circle collision detection system`

- `src/systems/collision.ts` — `circlesOverlap()`, `checkPlayerEnemyCollisions()`
- `src/systems/collision.test.ts` — Overlap geometry, invincibility, inactive skip

### Commit 4: `add wave spawner with escalating difficulty`

- `src/systems/spawner.ts` — Spawner class with wave progression
- `src/systems/spawner.test.ts` — Wave timing, cap, positioning, runner introduction

### Commit 5: `integrate enemies, spawner, and collision into game loop`

- `src/game.ts` — Wire everything together
- `src/game.test.ts` — Integration tests
- `src/main.ts` — No changes expected

## 5. Test strategy

| What                              | How                                                                   | Why                |
| --------------------------------- | --------------------------------------------------------------------- | ------------------ |
| Enemy moves toward target         | Enemy at (100,0), target (0,0), update 1s, check x decreased by speed | Core AI            |
| Diagonal chase is normalized      | Enemy chasing diagonally, check speed equals config.speed             | No sqrt(2) boost   |
| Shambler vs Runner are different  | Compare speed, radius, health from configs                            | Data-driven works  |
| takeDamage reduces health         | Call takeDamage(10), check health = 90                                | Damage works       |
| I-frames prevent repeat damage    | takeDamage, immediate takeDamage, only first applies                  | I-frames work      |
| I-frames expire                   | Advance time past duration, takeDamage again applies                  | Timer ticks down   |
| circlesOverlap true when touching | Centers 10 apart, radii 6 each (sum 12 > 10)                          | Geometry           |
| circlesOverlap false when apart   | Centers 20 apart, radii 6 each (sum 12 < 20)                          | No false positives |
| Spawner respects cap              | activeCount = max, update returns empty array                         | Cap enforced       |
| Wave advances at 30s              | Advance time past 30s, check waveNumber = 2                           | Progression works  |
| Spawn position is off-screen      | Check distance > half-diagonal                                        | Never visible      |
| Despawn removes far enemies       | Enemy 2× spawn radius away, check marked inactive                     | Cleanup works      |

## 6. Risks & mitigations

| Risk                                                         | Severity | Likelihood | Mitigation                                                                                               |
| ------------------------------------------------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| Tuning numbers feel wrong (too many enemies, too fast, etc.) | Low      | High       | All constants are named and at file top — easy to tweak post-deploy                                      |
| Game unplayable without weapons                              | Medium   | Medium     | Enemy cap + despawn keeps it manageable. Player speed (200) > Shambler speed (60) so you can outrun them |
| Float precision in collision                                 | Low      | Low        | Circle-circle is numerically stable. Use distance² vs (r₁+r₂)² to avoid sqrt                             |

## 7. Acceptance criteria

- [ ] Enemies spawn off-screen and walk toward the player
- [ ] Two enemy types visible (different colors, different speeds)
- [ ] Contact with an enemy deals damage (health bar decreases)
- [ ] Player flickers during invincibility frames
- [ ] Enemy count is capped (no unbounded growth)
- [ ] Far-away enemies are despawned
- [ ] Wave counter advances over time (visible in HUD)
- [ ] Difficulty increases with waves (more enemies, runners appear)
- [ ] Player can survive by outrunning enemies (speed 200 > shambler 60)
- [ ] All tests pass (`npm test`)
- [ ] All pre-commit gates pass
- [ ] `npm run build` succeeds

## 8. How this sets up F-004

The architecture here directly supports projectiles:

1. **`circlesOverlap()`** — reused for projectile-enemy collision
2. **Enemy.health** — projectiles reduce it, `active = false` when ≤ 0
3. **Entity interface with `active` flag** — projectiles implement the same interface
4. **Array-of-entities in game.ts** — `projectiles: Projectile[]` follows the `enemies: Enemy[]` pattern exactly
5. **Enemy cap** — can increase once enemies are killable
6. **Object pool upgrade path** — `active` flag converts trivially to pool acquire/release
