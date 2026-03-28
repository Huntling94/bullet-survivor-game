# BRF-004: Projectile System with Auto-Aim

## 1. Objective

**What it delivers:** The player's weapon auto-fires at the nearest enemy. Projectiles travel in a straight line, damage enemies on contact, and enemies die when their health reaches zero. The core gameplay loop is now complete: move, dodge, kill, survive.

**What it doesn't:** No XP drops from killed enemies (F-005), no upgrade system (F-005), no death effects (F-006).

**Why now:** Step 4 of the implementation order. The player can dodge enemies but has no way to fight back. Projectiles close the loop — you can now kill what's trying to kill you.

### New concepts introduced

| Concept                  | What it is                                                               | Why it matters                                                                                                                                                                                                                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Object pooling**       | Pre-allocating objects and recycling them instead of creating/destroying | The key learning goal. In a browser, creating 100+ short-lived objects per second pressures the garbage collector. GC pauses cause frame stutters — exactly the jank that destroys game feel. A pool recycles memory slots, eliminating GC pressure. This pattern is used for projectiles now, and reused for particles and damage numbers in F-006. |
| **Auto-aim targeting**   | Finding the nearest enemy each frame using distance²                     | The simplest targeting algorithm: loop through all enemies, track the one with the smallest squared distance. No sqrt needed — if `a² < b²` then `a < b`. O(n) per frame, which is fine at 50 enemies.                                                                                                                                               |
| **Projectile lifecycle** | Spawn → travel → hit or expire → recycle                                 | Projectiles are short-lived: activate from pool, move in a straight line, deactivate on hit or max range, release back to pool. This activate/deactivate pattern replaces constructor/garbage-collection.                                                                                                                                            |
| **Pierce**               | A projectile hitting multiple enemies before disappearing                | Modeled as a counter: each hit decrements `pierceRemaining`. When it hits 0, the projectile deactivates. Default pierce = 1 (single hit). F-005 upgrades increase it.                                                                                                                                                                                |
| **Weapon as data**       | Fire rate, damage, speed, range as configurable stats                    | The weapon is the upgrade target in F-005. Making its properties a mutable `WeaponStats` object means upgrades just change numbers — no structural changes needed.                                                                                                                                                                                   |

## 2. Design decisions

### DD-1: Object pool now (not deferred)

- **Problem:** Projectiles fire every 0.4s, live for ~1s. That's continuous allocation and garbage collection.
- **Decision:** Introduce a generic `ObjectPool<T>` utility and use it for projectiles immediately.
- **Rationale:** CLAUDE.md explicitly lists "how object pools work and why games use them" as a learning goal. Projectiles are the first high-frequency entity — the natural place to introduce pooling. The pool is generic, so F-006 reuses it for particles and damage numbers with zero new infrastructure.
- **Consequence:** Projectile class has `activate()`/`deactivate()` instead of being constructed/destroyed. The pool manages the active set.

### DD-2: Auto-aim via nearest-enemy search

- **Problem:** How does the weapon know what to shoot at?
- **Decision:** `findNearestEnemy(origin, enemies)` loops through all active enemies, returns the closest by distance². Fires toward where the target _is_ (not predicted position).
- **Rationale:** O(n) search at n=50 is trivially fast. Predictive aiming (leading the target) would make the game too easy — the slight miss on fast-moving runners is intentional difficulty.
- **Consequence:** Added to `collision.ts` alongside existing collision functions.

### DD-3: Weapon as a separate class with mutable stats

- **Problem:** Where does fire rate, damage, projectile speed live? In Player? In Game? Hardcoded?
- **Decision:** `Weapon` class with a `WeaponStats` object (fire rate, damage, speed, radius, pierce, range). Game owns the weapon and orchestrates firing.
- **Rationale:** F-005 upgrades modify weapon stats. If stats are a plain object on a Weapon class, upgrades are just `weapon.stats.damage += 5`. No structural change needed. Not in Player because Player handles movement and damage-taking — separation of concerns.
- **Consequence:** Weapon class is simple (timer + stats). Game handles the auto-aim + fire orchestration.

### DD-4: Enemy.takeDamage() method

- **Problem:** How do projectiles damage enemies?
- **Decision:** Add `takeDamage(amount)` to Enemy, mirroring Player's method. Sets `active = false` when health ≤ 0.
- **Rationale:** Centralizes the death check. When F-006 adds death particles and screen shake, they hook into `takeDamage()` — one place, not scattered across collision code.
- **Consequence:** Enemy death is now explicit and hookable.

### DD-5: Straight-line projectiles with max range (not tracking)

- **Problem:** Should projectiles track their target or travel in a straight line?
- **Decision:** Straight line. Direction is set at fire time and never changes. Deactivate after traveling `maxRange` pixels (measured from origin, not from screen edge).
- **Rationale:** Tracking projectiles would be too powerful — every shot would hit. Straight-line with fixed range creates intentional misses against fast enemies, adding skill expression. Range is measured from origin (not screen-based) because the camera moves with the player.
- **Consequence:** Projectile stores `origin`, `velocity` (direction × speed), and `distanceTraveled`.

### DD-6: Raise enemy cap from 30 to 50

- **Problem:** With enemies dying, the cap of 30 is too conservative — the screen feels empty.
- **Decision:** Raise `MAX_ENEMIES_BASE` from 30 to 50, keep `+5 per wave`.
- **Rationale:** Now that enemies die, the effective count self-regulates. Killing fast enough keeps the count low; not killing fast enough lets it climb to the cap. This creates natural pressure scaling.
- **Consequence:** One constant change in `spawner.ts`.

## 3. File changes

| File                              | Action | What it does                                         | Risk   |
| --------------------------------- | ------ | ---------------------------------------------------- | ------ |
| `src/utils/object-pool.ts`        | Create | Generic ObjectPool with acquire/release              | Low    |
| `src/utils/object-pool.test.ts`   | Create | Pool lifecycle tests                                 | Low    |
| `src/entities/projectile.ts`      | Create | Projectile with pool-compatible activate/deactivate  | Medium |
| `src/entities/projectile.test.ts` | Create | Movement, range, pierce tests                        | Low    |
| `src/entities/weapon.ts`          | Create | Weapon stats + fire rate timer                       | Low    |
| `src/entities/weapon.test.ts`     | Create | Fire rate timing tests                               | Low    |
| `src/entities/enemy.ts`           | Modify | Add takeDamage() with death                          | Low    |
| `src/entities/enemy.test.ts`      | Modify | Damage and death tests                               | Low    |
| `src/systems/collision.ts`        | Modify | Add findNearestEnemy, checkProjectileEnemyCollisions | Medium |
| `src/systems/collision.test.ts`   | Modify | Targeting and projectile-enemy tests                 | Low    |
| `src/systems/spawner.ts`          | Modify | Raise MAX_ENEMIES_BASE to 50                         | Low    |
| `src/game.ts`                     | Modify | Integrate weapon, pool, projectiles                  | Medium |
| `src/game.test.ts`                | Modify | Integration tests                                    | Low    |

## 4. Implementation plan

### Commit 1: `add generic object pool with acquire/release lifecycle`

- `src/utils/object-pool.ts`
- `src/utils/object-pool.test.ts`

### Commit 2: `add enemy takeDamage method with death on zero health`

- `src/entities/enemy.ts` — add `takeDamage(amount)`
- `src/entities/enemy.test.ts` — damage, death, inactive-no-op tests

### Commit 3: `add projectile entity with pool-compatible lifecycle`

- `src/entities/projectile.ts`
- `src/entities/projectile.test.ts`

### Commit 4: `add weapon with fire rate timer and auto-aim targeting`

- `src/entities/weapon.ts` + tests
- `src/systems/collision.ts` — add `findNearestEnemy()`, `checkProjectileEnemyCollisions()`
- `src/systems/collision.test.ts` — targeting and projectile collision tests

### Commit 5: `integrate projectile system into game loop`

- `src/game.ts` — wire everything together
- `src/game.test.ts` — integration tests
- `src/systems/spawner.ts` — raise enemy cap

## 5. Test strategy

| What                                     | How                                              | Why                  |
| ---------------------------------------- | ------------------------------------------------ | -------------------- |
| Pool acquire returns item                | Acquire from pool, check item exists             | Core contract        |
| Pool recycles on release                 | Acquire, release, acquire — same instance        | Proves recycling     |
| Pool grows beyond initial size           | Acquire more than initialSize                    | Pool is elastic      |
| Pool getActive tracks correctly          | Acquire 3, release 1, check 2 active             | Active count correct |
| Enemy.takeDamage reduces health          | 10 damage to 30hp → health = 20                  | Damage works         |
| Enemy dies at zero health                | 30 damage to 30hp → active = false               | Death works          |
| Enemy.takeDamage no-op when inactive     | Inactive + damage → health unchanged             | No zombie damage     |
| Projectile moves along velocity          | Activate rightward, update 1s, check position    | Movement works       |
| Projectile deactivates at max range      | Update past range → active = false               | Range limit works    |
| Pierce decrements on hit                 | Pierce=2, hit, still active; hit again, inactive | Pierce works         |
| findNearestEnemy returns closest         | Two enemies, different distances                 | Targeting works      |
| findNearestEnemy returns null for empty  | No active enemies → null                         | Edge case            |
| Projectile-enemy collision damages enemy | Overlap → enemy health reduced                   | Collision works      |
| Weapon fires after interval              | Update past fireRate → canFire() = true          | Fire rate works      |
| No firing when no enemies                | Game with 0 enemies → 0 projectiles              | No wasted shots      |

## 6. Risks & mitigations

| Risk                                       | Severity | Likelihood | Mitigation                                                                           |
| ------------------------------------------ | -------- | ---------- | ------------------------------------------------------------------------------------ |
| Object pool complexity obscures game logic | Medium   | Medium     | Introduce pool in commit 1 with thorough explanation before any game code uses it    |
| Collision is O(projectiles × enemies)      | Low      | Low        | At 10 × 50 = 500 checks, trivial. Spatial partitioning added if profiling shows need |
| Tuning feels wrong (fire rate, damage)     | Low      | High       | All constants named. Shambler dies in 3 hits (10 damage, 30 hp) for responsive feel  |
| readonly radius on Entity vs pool reset    | Medium   | Medium     | Projectile uses fixed radius (4) set in constructor, never changes across resets     |

## 7. Solution design

### Interfaces and types

```typescript
// src/utils/object-pool.ts — Generic pool, reused for particles in F-006
class ObjectPool<T> {
  constructor(factory: () => T, reset: (item: T) => void, initialSize: number);
  acquire(): T; // returns recycled or new instance
  release(item: T): void; // marks item as available for reuse
  getActive(): T[]; // items currently in use
  get activeLength(): number;
  clear(): void;
}
```

**How it works internally:** The pool maintains a single array. Items at indices `[0, activeCount)` are in use. Items at `[activeCount, pool.length)` are available. `acquire()` returns `pool[activeCount++]` (or creates a new one). `release()` swaps the released item with the last active item and decrements `activeCount`. Both are O(1).

```typescript
// src/entities/projectile.ts
class Projectile implements Entity {
  position: Vector2;
  readonly radius: number; // fixed at 4px
  active: boolean;

  activate(
    origin: Vector2,
    direction: Vector2,
    config: ProjectileConfig,
    pierce: number,
  ): void;
  deactivate(): void;
  update(dt: number): void; // move + range check
  render(ctx: CanvasRenderingContext2D): void;
  onHitEnemy(): boolean; // decrements pierce, returns true if projectile should deactivate

  // Accessed by collision system:
  get damage(): number;
}

// src/entities/weapon.ts
interface WeaponStats {
  fireRate: number; // seconds between shots (0.4)
  damage: number; // per projectile (10)
  projectileSpeed: number; // pixels/second (400)
  projectileRadius: number; // collision radius (4)
  pierce: number; // enemies hit per projectile (1)
  range: number; // max travel distance (500)
}

class Weapon {
  stats: WeaponStats; // mutable — F-005 upgrades modify these directly
  constructor(stats?: Partial<WeaponStats>);
  update(dt: number): void; // ticks fire timer
  canFire(): boolean;
  resetFireTimer(): void;
}
```

### Key logic: auto-aim and fire (in Game.update)

```typescript
// Find nearest enemy (added to collision.ts)
function findNearestEnemy(origin: Vector2, enemies: Enemy[]): Enemy | null {
  let nearest: Enemy | null = null;
  let nearestDistSq = Infinity;
  for (const enemy of enemies) {
    if (!enemy.active) continue;
    const dx = origin.x - enemy.position.x;
    const dy = origin.y - enemy.position.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearest = enemy;
    }
  }
  return nearest;
}

// In Game.update(), after weapon.update(dt):
if (this.weapon.canFire()) {
  const target = findNearestEnemy(this.player.position, this.enemies);
  if (target) {
    const direction = target.position
      .subtract(this.player.position)
      .normalize();
    const projectile = this.projectilePool.acquire();
    projectile.activate(
      this.player.position,
      direction,
      projectileConfig,
      this.weapon.stats.pierce,
    );
    this.weapon.resetFireTimer();
  }
}
```

### Key logic: projectile-enemy collision (in collision.ts)

```typescript
function checkProjectileEnemyCollisions(
  projectiles: Projectile[],
  enemies: Enemy[],
): void {
  for (const projectile of projectiles) {
    if (!projectile.active) continue;
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      if (
        circlesOverlap(
          projectile.position,
          projectile.radius,
          enemy.position,
          enemy.radius,
        )
      ) {
        enemy.takeDamage(projectile.damage);
        if (projectile.onHitEnemy()) break; // pierce exhausted
      }
    }
  }
}
```

### Key logic: object pool acquire/release

```typescript
acquire(): T {
  if (this.activeCount < this.pool.length) {
    // Recycle an existing item
    return this.pool[this.activeCount++]!;
  }
  // Grow the pool
  const item = this.factory();
  this.pool.push(item);
  this.activeCount++;
  return item;
}

release(item: T): void {
  const index = this.pool.indexOf(item);
  if (index === -1 || index >= this.activeCount) return;
  this.activeCount--;
  // Swap with last active item
  this.pool[index] = this.pool[this.activeCount]!;
  this.pool[this.activeCount] = item;
  this.reset(item);
}
```

**Why swap-with-last?** Removing from the middle of an array is O(n) (shift everything). Swapping with the last active item and decrementing the count is O(1). Order doesn't matter for projectiles — they're all processed identically.

### Game update loop order (revised)

```
1.  player.update(dt, input)
2.  weapon.update(dt)                          // tick fire timer
3.  auto-aim: find nearest enemy, fire if ready
4.  spawner.update(...) → create new enemies
5.  enemy.update(dt, playerPosition)           // all enemies chase
6.  projectile.update(dt) for each active      // move projectiles
7.  checkProjectileEnemyCollisions()           // damage + pierce
8.  release deactivated projectiles to pool
9.  despawn far enemies + remove inactive
10. checkPlayerEnemyCollisions()               // contact damage
11. death check → gameOver
12. camera + FPS
```

## 8. Acceptance criteria

- [ ] Weapon auto-fires at nearest enemy without player input
- [ ] Projectiles travel in a straight line from player toward target
- [ ] Projectiles damage enemies on contact (health bar decreases)
- [ ] Enemies die (disappear) when health reaches 0
- [ ] Projectiles disappear after hitting an enemy (pierce = 1 default)
- [ ] Projectiles disappear after traveling max range
- [ ] No firing when no enemies exist
- [ ] Object pool recycles projectile instances (no continuous allocation)
- [ ] Enemy cap raised to 50 (game feels more active)
- [ ] All tests pass (`npm test`)
- [ ] All pre-commit gates pass
- [ ] `npm run build` succeeds

## 9. How this sets up F-005

1. **WeaponStats is mutable** — upgrades directly modify `weapon.stats.damage += 5`, `weapon.stats.pierce += 1`, etc.
2. **Pierce already implemented** — "pierce" upgrade just increases the counter
3. **Object pool** — handles scaling projectile count as fire rate increases
4. **Enemy death** — triggers XP gem drops (F-005 hooks into `takeDamage()` or the death check)
