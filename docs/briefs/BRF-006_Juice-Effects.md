# BRF-006: Juice — Screen Shake, Particles, Damage Numbers, Flash Effects

> CLAUDE.md: "Step 6 is the most important step for learning. Spend the most time here."

## 1. Objective

**What it delivers:** Every game event produces multiple feedback channels — visual flash, motion, particles, numbers. The game transforms from "functional" to "satisfying." This is the difference between a prototype and something people want to play.

**What it doesn't:** No new gameplay mechanics. Identical game logic, dramatically different feel.

**Why now:** This is the whole point of the project. CLAUDE.md explicitly calls this the most important step. "Game feel" is the primary learning objective — every concept from F-001 through F-005 exists to set up this feature.

### Why juice matters (the learning bit)

**Juice is the gap between "it works" and "it feels good."** Consider killing an enemy:

Without juice: Enemy disappears. You see nothing, hear nothing, feel nothing.

With juice: Enemy flashes white on hit. Damage number pops up. Enemy gets knocked back slightly. On the killing blow, it explodes into 10 particles. The camera shakes for 2 frames. The damage number turns yellow.

Same game logic. Same balance. Same difficulty. But one version _feels_ powerful and the other feels like clicking spreadsheet cells. Every successful action game — from Doom to Hades to Vampire Survivors — invests more engineering time in juice than in mechanics.

### The juice checklist (from CLAUDE.md)

| Event      | Visual                      | Motion                | Other                           |
| ---------- | --------------------------- | --------------------- | ------------------------------- |
| Hit enemy  | White flash (1 frame)       | Knockback push        | Damage number floats up         |
| Kill enemy | Death particle burst (8-12) | —                     | Screen shake (small)            |
| Pick up XP | Gem flies to player ✓DONE   | Scale-pulse on absorb | XP bar flash                    |
| Level up   | Screen flash                | Time freeze (0.3s)    | UI panel slides in ✓DONE        |
| Player hit | Red vignette flash          | Camera shake (large)  | Invincibility frames ✓DONE      |
| Wave start | —                           | —                     | Wave number text scales + fades |

**Principle:** Every event has multiple feedback channels (visual + motion + other). One channel = flat. Two = noticeable. Three = satisfying.

## 2. Design decisions

### DD-1: Collision functions return hit results (not events/callbacks)

- **Problem:** Effects need to know where hits happened, how much damage, whether it killed. Currently collision functions return void.
- **Decision:** `checkProjectileEnemyCollisions` returns `ProjectileHitResult[]`. `checkPlayerEnemyCollisions` returns `PlayerHitResult | null`. Game uses these results to trigger effects.
- **Rationale:** Returning data is simpler than an event bus, easier to test (inspect return values), and keeps Game as the sole orchestrator. The codebase has no event system and doesn't need one at this scale.
- **Consequence:** Small refactor of collision.ts. Existing callers (Game) already use the results implicitly — now the information is explicit.

### DD-2: Camera owns screen shake state

- **Problem:** Where does shake state live?
- **Decision:** Camera gains `shake(intensity, duration)`. Shake offset is added in `applyTransform`. Linear decay (shake fades out over duration).
- **Rationale:** Shake is a camera-space effect — it modifies the camera's transform. A separate system would just communicate an offset back to Camera, adding indirection. Also adds smooth camera follow while we're in there (using the previously-unused `_dt` parameter).
- **Consequence:** Camera becomes the most complex system class (but still <50 lines).

### DD-3: Single Particle class, multiple configs

- **Problem:** Death bursts, hit sparks — same class or different?
- **Decision:** One `Particle` class with configurable speed, size, color, lifetime. `ParticleSystem` owns the pool and provides `burst(position, count, config)`. Different effects = different config constants.
- **Rationale:** Particles all behave identically (move, shrink, fade, die). The difference is just numbers: speed range, count, color. One class + one pool + N configs. Same data-driven pattern as enemy types.
- **Consequence:** `DEATH_BURST_CONFIG` and `HIT_SPARK_CONFIG` as named constants.

### DD-4: Enemy hit flash via timer (not separate overlay)

- **Problem:** How to make enemies flash white for "1 frame"?
- **Decision:** Add `flashTimer` to Enemy. When > 0, render in white instead of config color. Timer decays in update(). Set to ~0.05s (3 frames at 60fps — reads as "one frame" to the eye but is frame-rate-independent).
- **Rationale:** Simpler than a separate overlay system. The flash is per-entity state, like health. Keeps rendering logic inside the entity where it belongs.

### DD-5: Time freeze before level-up UI

- **Problem:** CLAUDE.md specifies "time freeze (0.3s)" on level up. How?
- **Decision:** `freezeTimer` in Game. On level-up, set `freezeTimer = 0.3` and trigger a white screen flash. While freeze > 0, skip game logic but still render and update effects (particles, damage numbers still animate). When freeze expires, then pause and show upgrade UI.
- **Rationale:** The freeze creates a dramatic beat — "something important just happened" — before the UI appears. Effects still animating during the freeze makes it feel alive rather than broken.

### DD-6: Knockback as decaying velocity on Enemy

- **Problem:** How to push enemies on hit?
- **Decision:** Enemy gains `knockbackVelocity: Vector2`. On hit, set to direction away from projectile scaled by KNOCKBACK_STRENGTH. In update(), apply knockback to position and decay it exponentially. Skip chase movement while knockback is strong.
- **Rationale:** Exponential decay creates a sharp "push" followed by gradual recovery. The enemy staggers, then resumes chasing. This is more satisfying than linear decay because the initial push is dramatic.

## 3. File changes

| File                                | Action | What it does                              | Risk   |
| ----------------------------------- | ------ | ----------------------------------------- | ------ |
| `src/systems/camera.ts`             | Modify | Add shake + smooth follow                 | Medium |
| `src/systems/camera.test.ts`        | Modify | Shake tests                               | Low    |
| `src/effects/particle.ts`           | Create | Particle + ParticleSystem with pool       | Medium |
| `src/effects/particle.test.ts`      | Create | Burst, lifetime, pool release tests       | Low    |
| `src/effects/damage-number.ts`      | Create | DamageNumber + DamageNumberSystem         | Medium |
| `src/effects/damage-number.test.ts` | Create | Spawn, float, fade tests                  | Low    |
| `src/effects/screen-flash.ts`       | Create | ScreenFlash for vignette + full flash     | Low    |
| `src/effects/screen-flash.test.ts`  | Create | Trigger, decay tests                      | Low    |
| `src/entities/enemy.ts`             | Modify | flashTimer + knockback                    | Medium |
| `src/entities/enemy.test.ts`        | Modify | Flash and knockback tests                 | Low    |
| `src/systems/collision.ts`          | Modify | Return hit results                        | Medium |
| `src/systems/collision.test.ts`     | Modify | Verify return values                      | Low    |
| `src/game.ts`                       | Modify | Wire all effects, freeze timer, wave text | High   |
| `src/game.test.ts`                  | Modify | Integration tests                         | Medium |

## 4. Implementation plan

### Commit 1: `add screen shake and smooth follow to camera`

- `src/systems/camera.ts` — shake(intensity, duration), smooth follow with dt
- `src/systems/camera.test.ts` — shake offset, decay, smooth follow tests

### Commit 2: `add particle system with object pool and burst factory`

- `src/effects/particle.ts` — Particle class, ParticleSystem, DEATH_BURST_CONFIG, HIT_SPARK_CONFIG
- `src/effects/particle.test.ts` — burst count, lifetime, pool release

### Commit 3: `add damage number system with float-up and fade`

- `src/effects/damage-number.ts` — DamageNumber, DamageNumberSystem
- `src/effects/damage-number.test.ts` — spawn, movement, fade, pool release

### Commit 4: `add hit flash and knockback to enemy`

- `src/entities/enemy.ts` — flashTimer, knockbackVelocity, modified takeDamage
- `src/entities/enemy.test.ts` — flash, knockback, decay tests

### Commit 5: `add screen flash overlay for vignette and level-up`

- `src/effects/screen-flash.ts` — ScreenFlash with trigger, update, render
- `src/effects/screen-flash.test.ts` — trigger, decay tests

### Commit 6: `return hit results from collision and wire all effects into game`

- `src/systems/collision.ts` — return ProjectileHitResult[], PlayerHitResult
- `src/systems/collision.test.ts` — verify return values
- `src/game.ts` — integrate all effect systems, freeze timer, wave text, XP flash
- `src/game.test.ts` — integration tests

## 5. Solution design

### Interfaces and types

```typescript
// src/systems/collision.ts — hit results
interface ProjectileHitResult {
  position: Vector2;
  damage: number;
  enemyKilled: boolean;
  knockbackDirection: Vector2; // normalized, points from projectile toward enemy
}

interface PlayerHitResult {
  position: Vector2;
  damage: number;
}

// src/effects/particle.ts
interface ParticleConfig {
  readonly speedMin: number;
  readonly speedMax: number;
  readonly sizeMin: number;
  readonly sizeMax: number;
  readonly lifetime: number;
  readonly color: string;
}

// Predefined configs:
const DEATH_BURST_CONFIG: ParticleConfig = {
  speedMin: 80,
  speedMax: 200,
  sizeMin: 2,
  sizeMax: 5,
  lifetime: 0.4,
  color: "#e53935", // enemy color (overridden per-call for runner kills)
};

const HIT_SPARK_CONFIG: ParticleConfig = {
  speedMin: 50,
  speedMax: 150,
  sizeMin: 1,
  sizeMax: 3,
  lifetime: 0.15,
  color: "#fff",
};
```

### Key classes

```typescript
// src/systems/camera.ts — enhanced with shake + smooth follow
class Camera {
  position: Vector2;
  private shakeIntensity: number;
  private shakeDuration: number;
  private shakeTimer: number;

  shake(intensity: number, duration: number): void;
  update(target: Vector2, dt: number): void; // smooth follow + shake decay
  applyTransform(ctx, screenW, screenH): void; // includes shake offset
  resetTransform(ctx): void;
}

// src/effects/particle.ts
class Particle {
  position: Vector2;
  velocity: Vector2;
  lifetime: number;
  maxLifetime: number;
  size: number;
  color: string;
  active: boolean;
  activate(pos, vel, size, color, lifetime): void;
  deactivate(): void;
  update(dt): void;
  render(ctx): void;
  get alpha(): number; // lifetime / maxLifetime
}

class ParticleSystem {
  private pool: ObjectPool<Particle>;
  burst(position: Vector2, count: number, config: ParticleConfig): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

// src/effects/damage-number.ts
class DamageNumber {
  position: Vector2;
  text: string;
  lifetime: number;
  maxLifetime: number;
  color: string;
  active: boolean;
  activate(pos, amount, isKill): void;
  deactivate(): void;
  update(dt): void;
  render(ctx): void;
}

class DamageNumberSystem {
  private pool: ObjectPool<DamageNumber>;
  spawn(position: Vector2, amount: number, isKill: boolean): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

// src/effects/screen-flash.ts
class ScreenFlash {
  trigger(color: string, duration: number): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D, width: number, height: number): void;
}
```

### Key logic: screen shake (src/systems/camera.ts)

```typescript
shake(intensity: number, duration: number): void {
  // Take the stronger shake if already shaking
  if (intensity > this.shakeIntensity) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }
}

update(target: Vector2, dt: number): void {
  // Smooth follow
  const smoothing = 1 - Math.pow(0.0001, dt);  // frame-rate-independent lerp
  this.position = this.position.add(
    target.subtract(this.position).scale(smoothing)
  );

  // Decay shake
  if (this.shakeTimer > 0) {
    this.shakeTimer = Math.max(0, this.shakeTimer - dt);
  }
}

applyTransform(ctx, screenW, screenH): void {
  ctx.save();
  let offsetX = screenW / 2 - this.position.x;
  let offsetY = screenH / 2 - this.position.y;

  // Apply shake
  if (this.shakeTimer > 0) {
    const progress = this.shakeTimer / this.shakeDuration;
    const magnitude = this.shakeIntensity * progress;
    offsetX += (Math.random() * 2 - 1) * magnitude;
    offsetY += (Math.random() * 2 - 1) * magnitude;
  }

  ctx.translate(offsetX, offsetY);
}
```

**Why frame-rate-independent lerp?** `lerp(a, b, 0.1)` at 60fps behaves differently than at 30fps — you'd smooth twice as much at double the frame rate. `1 - pow(base, dt)` produces the same visual result regardless of frame rate. This is the correct way to do smooth follow.

### Key logic: effect wiring in Game.update()

```typescript
// After projectile-enemy collision:
const hits = checkProjectileEnemyCollisions(projectiles, enemies);
for (const hit of hits) {
  this.damageNumbers.spawn(hit.position, hit.damage, hit.enemyKilled);
  this.particles.burst(hit.position, 3, HIT_SPARK_CONFIG);
  if (hit.enemyKilled) {
    this.particles.burst(hit.position, 10, DEATH_BURST_CONFIG);
    this.camera.shake(3, 0.06);
  }
}

// After player-enemy collision:
const playerHit = checkPlayerEnemyCollisions(player, enemies);
if (playerHit) {
  this.screenFlash.trigger("rgba(255, 0, 0, 0.3)", 0.2);
  this.camera.shake(8, 0.15);
}

// Level up with freeze:
if (leveledUp) {
  this.screenFlash.trigger("rgba(255, 255, 255, 0.5)", 0.15);
  this.freezeTimer = 0.3;
}

// Freeze timer (at top of update):
if (this.freezeTimer > 0) {
  this.freezeTimer -= dt;
  this.particles.update(dt); // effects still animate
  this.damageNumbers.update(dt);
  this.screenFlash.update(dt);
  if (this.freezeTimer <= 0) {
    this.paused = true;
    this.leveling.pendingUpgradeChoices = this.leveling.generateChoices();
  }
  return;
}
```

### Render order (updated)

World space (inside camera transform):

1. Grid
2. XP gems
3. Projectiles
4. Enemies
5. Player
6. **Particles** (on top of entities)
7. **Damage numbers** (on top of everything in world)

Screen space:

1. FPS, wave number
2. XP bar
3. **Wave start text** (centered, scaling + fading)
4. **Screen flash overlays** (vignette, white flash)
5. Upgrade UI (if paused)
6. Game over (if dead)

## 6. Test strategy

| What                    | How                                                                      | Why             |
| ----------------------- | ------------------------------------------------------------------------ | --------------- |
| Camera shake offset     | shake(5, 0.1), applyTransform, check translate args differ from unshaken | Shake works     |
| Shake decays to zero    | shake, advance past duration, check no offset                            | Decay works     |
| Particle burst count    | burst(pos, 10, config), check pool has 10 active                         | Burst spawns    |
| Particles expire        | Create particle, advance past lifetime, check released                   | Cleanup works   |
| Damage number floats up | Spawn, update 0.1s, check position.y decreased                           | Movement works  |
| Damage number fades     | Check alpha decreases over time                                          | Fade works      |
| Enemy flash on hit      | takeDamage, check flashTimer > 0                                         | Flash triggers  |
| Enemy flash decays      | Advance past 0.05s, check flashTimer = 0                                 | Flash ends      |
| Knockback moves enemy   | takeDamage with direction, check position changed                        | Knockback works |
| Knockback decays        | Advance time, check knockback velocity shrinks                           | Decay works     |
| Screen flash trigger    | trigger, check active                                                    | Flash starts    |
| Screen flash decays     | Advance past duration, check inactive                                    | Flash ends      |
| Collision returns hits  | Projectile overlaps enemy, check result has position + damage            | Results correct |
| Collision returns kill  | Kill enemy, check result has enemyKilled = true                          | Kill detected   |

## 7. Risks & mitigations

| Risk                                      | Severity | Likelihood | Mitigation                                                |
| ----------------------------------------- | -------- | ---------- | --------------------------------------------------------- |
| Collision return type change breaks tests | Medium   | High       | Update all tests in same commit                           |
| Particle pool unbounded                   | Low      | Medium     | Cap pool, auto-release oldest                             |
| Freeze timer changes level-up flow        | Medium   | Medium     | Test freeze→pause transition explicitly                   |
| Screen shake feels nauseating             | Low      | Medium     | Start conservative (3px kill, 8px player hit), tune later |
| Too many canvas state changes             | Low      | Low        | Batch render by color where possible                      |

## 8. Acceptance criteria

- [ ] Enemies flash white when hit by projectile
- [ ] Enemies get knocked back slightly on hit
- [ ] Damage numbers float up from hit position and fade out
- [ ] Kill damage numbers are yellow (normal hits are white)
- [ ] 8-12 particles burst on enemy death
- [ ] Small screen shake on enemy kill
- [ ] Large screen shake on player hit
- [ ] Red vignette flash on player hit
- [ ] White screen flash on level up
- [ ] 0.3s time freeze before level-up UI appears
- [ ] Wave number text scales up and fades on new wave
- [ ] XP bar flashes briefly on gem collection
- [ ] Camera smoothly follows player (no longer instant snap)
- [ ] All effects use object pools (no allocation during gameplay)
- [ ] All tests pass
- [ ] All pre-commit gates pass
