# HANDOVER — Bullet Survivors

> Session date: 2026-03-27 → 2026-03-28
> Status: **Complete.** All 7 features implemented, tested, deployed.

## What was built

A fully playable Vampire Survivors-style 2D auto-shooter using TypeScript, Canvas 2D, and Vite. No game framework — raw Canvas API throughout.

**Live at:** https://huntling94.github.io/bullet-survivor-game/

### Feature registry (all complete)

| #     | Feature                                        | Key concepts taught                                                                    |
| ----- | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| F-001 | Canvas + game loop with delta time             | requestAnimationFrame, delta time, update/render separation                            |
| F-002 | Player movement with camera follow             | Input handling, entity pattern, camera transform, diagonal normalization               |
| F-003 | Enemy spawning and wave system                 | Enemy AI, invincibility frames, wave system, collision detection, data-driven entities |
| F-004 | Projectile system with auto-aim                | Object pooling, auto-aim targeting, projectile lifecycle, pierce mechanic              |
| F-005 | XP gems, leveling, upgrade selection           | Magnetic pickup, XP/leveling curve, upgrade system, game pause state                   |
| F-006 | Juice: screen shake, particles, damage numbers | Screen shake, particle system, damage numbers, hit flash, knockback, time freeze       |
| F-007 | Polish: enemy variety, wave scaling, game over | 4 enemy types, wave stat scaling, restart mechanism                                    |

### By the numbers

- **204 tests** passing (Vitest)
- **~22KB** production JS bundle (gzipped ~6.6KB)
- **16 source files** + 16 test files
- **7 implementation briefs** (BRF documents in `docs/briefs/`)
- **4 enemy types:** Shambler, Runner, Swarm, Tank
- **7 upgrades:** Damage, Fire Rate, Pierce, Big Shots, Speed, Magnet, Vitality
- **Pre-commit hooks** enforcing typecheck + tests + lint + format on every commit

## Architecture

```
src/
  main.ts              — Entry point, canvas, game loop (requestAnimationFrame)
  game.ts              — Game state orchestrator (~500 lines, the heart of the game)
  entities/
    types.ts           — Entity interface (position, radius, active)
    player.ts          — WASD movement, health, invincibility, upgradeable stats
    enemy.ts           — Data-driven configs (4 types), chase AI, knockback, flash
    projectile.ts      — Pool-compatible, straight-line, pierce, range limit
    weapon.ts          — Fire rate timer, mutable WeaponStats for upgrades
    xp-gem.ts          — Magnetic pickup with 1/dist acceleration
  systems/
    input.ts           — InputState interface + InputHandler (DI for testability)
    camera.ts          — Smooth follow, screen shake (linear decay)
    spawner.ts         — Continuous spawning, wave milestones, stat scaling, cluster spawn
    collision.ts       — Circle-circle (distance²), hit results for effect triggers
    leveling.ts        — XP tracking, 7 upgrade definitions, choice generation
  effects/
    particle.ts        — Particle + ParticleSystem with ObjectPool
    damage-number.ts   — Float-up text with fade, kill numbers yellow
    screen-flash.ts    — Full-screen color overlay with decay
  utils/
    vector2.ts         — Immutable 2D math (add, subtract, scale, normalize, etc.)
    object-pool.ts     — Generic acquire/release pool (swap-with-last, O(1))
```

**Key principle:** Game state is separate from rendering. `update(dt)` modifies state, `render(ctx)` draws it. Never mix.

## Key decisions made

| Decision                                         | Why                                                          |
| ------------------------------------------------ | ------------------------------------------------------------ |
| No game framework (raw Canvas 2D)                | Learning fundamentals, not framework APIs                    |
| Variable timestep (not fixed)                    | Simpler, sufficient for single-player, no determinism needed |
| Immutable Vector2                                | Clearer for learning, fewer mutation bugs                    |
| Data-driven entities (configs, not subclasses)   | Adding enemy types = adding config objects, not code         |
| Object pooling for projectiles/particles/gems    | Eliminates GC pressure from high-frequency allocation        |
| Dependency injection via interfaces (InputState) | Game never touches DOM, fully testable                       |
| Canvas-rendered UI (not HTML/CSS overlay)        | Consistent with rest of game, simpler                        |
| Collision returns hit results (not void)         | Enables effect triggers without event bus                    |
| Each subsystem has reset()                       | Enables R-to-restart without reconstructing objects          |

## What Will learned

1. **Delta time** — frame-rate-independent movement, clamping to prevent explosions
2. **Game feel / juice** — screen shake, particles, flash, knockback, freeze frames
3. **Object pools** — acquire/release lifecycle, swap-with-last for O(1)
4. **Update/render separation** — testable game logic without a browser
5. **Camera systems** — world→screen transform, smooth follow, shake
6. **Data-driven design** — one class, many configs, adding types without code changes
7. **Dependency injection** — interfaces for testability, concrete classes for production

## Lessons learned

| #   | Lesson                                                     | Prevention rule                                           |
| --- | ---------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Camera-follow on blank background makes movement invisible | Always include a visual reference frame (grid/background) |
| 2   | Non-null assertions (`!`) blocked by ESLint strict mode    | Use `as T` casts or helper functions instead              |
| 3   | Float precision in timer tests (30 × 1/60 ≠ 0.5)           | Use extra frames to push past thresholds in tests         |
| 4   | Unstaged files cause lint-staged git stash failures        | Stage all modified files before committing                |

## What could come next (if extending this game)

- **Sound effects** — Web Audio API, pooled audio sources
- **More weapon types** — area-of-effect, orbiting, chain lightning
- **Boss enemies** — scripted behavior, health phases
- **Persistent progression** — localStorage high scores, unlockable starting upgrades
- **Mobile support** — touch controls, virtual joystick
- **Performance** — spatial partitioning (grid or quadtree) for collision at scale

## Next project

Will is considering a **tower defense game** as Project 2. See `docs/tower-defense-strategy.html` for the game/product strategy document.
