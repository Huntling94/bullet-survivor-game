# CLAUDE.md — Bullet Survivors

> 2D auto-shooter in the style of Vampire Survivors. Project 1 of 5 in a game dev learning pathway.

## Purpose

This is a **learning project**. The goal is to teach Will game development fundamentals — specifically "game feel" / juice — through building a complete, polished 2D game. Every feature should be explained: what it does, why it works, and how it applies to future projects.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build
- `npx tsc --noEmit` — Type-check (run before every commit)
- `npm test` — Run Vitest suite

## Tech stack

- TypeScript strict mode
- Vite for build/dev
- HTML Canvas 2D (`<canvas>` element, `getContext('2d')`)
- **No game framework.** Raw Canvas API. Will needs to understand the fundamentals, not learn a framework.
- Vitest for tests (game logic only, not rendering)

## Essential context

- **Read `HANDOVER.md` at session start.** It has session history, decisions made, what's next.
- This project is part of a 5-project game dev learning pathway. See the Learning Pathway section below.

## Owner working style (non-negotiable)

Will is a strategy consultant with a CS background learning game development. He built a 32-session financial analytics platform and a 6-session 3D ecosystem simulator (Radiate) with previous Claude Code instances. These preferences are proven across 38+ sessions:

### Decision-making

- **Brief before code.** No medium+ feature without an implementation brief and explicit approval. Use `/plan`.
- **Explain the why.** Will is learning game dev. Explain new concepts, patterns, and trade-offs when they arise. Connect everything to the "why" — why does screen shake feel good? Why do particles use object pooling? Why is delta time important?
- **Challenge assumptions.** Present options with trade-offs, not defaults. When Will asks "how do others do this?" — survey approaches genuinely.
- **This is a learning exercise.** Code quality matters but the primary deliverable is Will's understanding. Optimise for teachability over elegance.

### Communication

- **Step-by-step reasoning in chat.** When explaining how something works, walk through the logic concretely with examples.
- **No demo language.** Never say "as a demo" or "for demonstration purposes." Everything built is real, production-intent code.
- **Post-implementation explanation.** After building a feature, explain: what was built, which pattern was chosen, what alternative was rejected and why. This builds Will's mental model.

### Quality governance

> Claude is the sole developer. There is no human code reviewer.
> Quality is enforced through automated gates and structured process.

#### Implementation briefs (BRF)

Before any medium or large feature, write a brief document at `docs/briefs/BRF-NNN_Title.md`. The brief must include:

1. **Objective** — what it delivers, what it doesn't, why now
2. **Design decisions** — numbered, each with Problem / Decision / Rationale / Consequence
3. **File changes** — which files are created/modified, with risk assessment
4. **Implementation plan** — commit sequence with scope per commit
5. **Test strategy** — what gets tested and how
6. **Risks & mitigations** — severity, likelihood, mitigation for each risk
7. **Acceptance criteria** — numbered checklist

Wait for explicit owner approval ("go ahead", "approved", "proceed") before implementing.

For small changes (< 30 minutes, single file, obvious approach), a brief chat description is sufficient — no formal BRF document needed.

#### Automated gates (pre-commit)

Set up Husky + lint-staged with:

| Gate        | Tool               | What it catches                     |
| ----------- | ------------------ | ----------------------------------- |
| Type safety | `tsc --noEmit`     | Type errors, strict mode violations |
| Tests       | `vitest run`       | Regressions                         |
| Lint        | `eslint`           | Code smells, unused vars            |
| Format      | `prettier --check` | Style inconsistency                 |

If any gate fails, the commit is rejected. Fix the root cause — never bypass.

#### Process quality

1. **Mandatory lessons learned.** Any rework gets a row in the Lessons Learned table in this file. No silent fixes.
2. **Session handovers.** Offer a handover summary at end of each session (what was built, decisions made, what's next). Update `HANDOVER.md`.
3. **Feature registry.** Track completed features in this file.

#### Velocity/robustness heuristic

> "Can we change this later without rewriting what depends on it?"

| Answer                                  | Action                                   | Examples                                           |
| --------------------------------------- | ---------------------------------------- | -------------------------------------------------- |
| **No** — it's a contract                | Slow down. Brief first. Test thoroughly. | Game loop architecture, entity system, state shape |
| **Yes** — it's an implementation detail | Move fast. Refactor freely later.        | Sprite sizes, colours, spawn rates, UI layout      |

## Architecture

```
src/
  main.ts          — Entry point, canvas setup, game loop
  game.ts          — Game state, update/render orchestration
  entities/        — Player, enemies, projectiles, XP gems
  systems/         — Collision, spawning, leveling, camera
  effects/         — Particles, screen shake, damage numbers, flash
  rendering/       — Sprite drawing, animation, camera transform
  utils/           — Math helpers, vector2, random, object pool
  ui/              — HUD overlay (HTML/CSS, not canvas)
```

**Key principle:** Game state is separate from rendering. `update(dt)` modifies state, `render(ctx)` draws it. Never mix.

## Game design

### Core loop

1. Player moves with WASD/arrow keys
2. Weapons auto-fire at nearest enemy
3. Enemies spawn in waves, walk toward player
4. Killed enemies drop XP gems
5. XP gems are magnetically attracted to player when close
6. Level up → choose 1 of 3 random upgrades
7. Survive as long as possible

### Juice checklist (the whole point of this project)

Every interaction should have _multiple_ feedback channels:

| Event      | Visual                                | Motion                | Other                                  |
| ---------- | ------------------------------------- | --------------------- | -------------------------------------- |
| Hit enemy  | White flash (1 frame)                 | Knockback push        | Damage number floats up                |
| Kill enemy | Death particle burst (8-12 particles) | —                     | Screen shake (small, 2 frames)         |
| Pick up XP | Gem flies to player (magnetic)        | Scale-pulse on absorb | XP bar flash                           |
| Level up   | Screen flash                          | Time freeze (0.3s)    | UI panel slides in                     |
| Player hit | Red vignette flash                    | Camera shake (large)  | Invincibility frames (sprite flickers) |
| Wave start | —                                     | —                     | Wave number text scales up + fades     |

### Entities

- **Player:** Circle or simple sprite. 4-directional movement. Health bar above head.
- **Enemies:** Different types (fast/weak, slow/strong, ranged). Simple AI: move toward player.
- **Projectiles:** From player weapons. Straight line or area effect.
- **XP gems:** Dropped by enemies. Magnetic pickup radius. Different sizes (1/5/25 XP).

### Upgrades (level-up choices)

- More projectiles, faster fire rate, bigger projectiles, move speed, pickup radius, max health, damage, pierce (projectile hits multiple enemies)

## Code conventions

- TypeScript strict mode. No `any`.
- Use `Vector2` class for all positions/velocities (create a simple one, don't import a library).
- All time in seconds (not milliseconds). Delta time passed to every update.
- Object pool pattern for particles, projectiles, and damage numbers. Explain why.
- Constants in SCREAMING_SNAKE_CASE at top of files.
- Vitest for tests. Test co-location: `<module>.test.ts` next to `<module>.ts`.
- Git: imperative commit messages, < 72 chars. Small focused commits.
- `npm run build` must pass before declaring work complete.

## Implementation order

Build in this order, each step playable:

1. **Canvas + game loop** — black screen, FPS counter, delta time
2. **Player movement** — circle on screen, WASD movement, camera follows
3. **Enemy spawning** — enemies walk toward player, collision kills player
4. **Projectile system** — auto-fire at nearest enemy, projectiles kill enemies
5. **XP gems + leveling** — drops, magnetic pickup, level-up pause + upgrade selection
6. **Juice pass** — screen shake, particles, damage numbers, flash effects, sound (optional)
7. **Polish** — enemy variety, wave scaling, game over screen, high score

Step 6 is the most important step for learning. Spend the most time here.

## Design principles

1. **Feel is the product.** If it doesn't feel satisfying, it's not done.
2. **State before rendering.** Game logic works without a screen. Rendering is a view of state.
3. **Explain before implement.** Every new pattern gets a "why" explanation in chat.
4. **Brief before code.** Speed makes discipline more important, not less.

## Lessons learned

| #   | Lesson | Root Cause | Prevention Rule |
| --- | ------ | ---------- | --------------- |
|     |        |            |                 |

## Feature registry

| #     | Feature                                        | Status      |
| ----- | ---------------------------------------------- | ----------- |
| F-001 | Canvas + game loop with delta time             | Complete    |
| F-002 | Player movement with camera follow             | Not started |
| F-003 | Enemy spawning and wave system                 | Not started |
| F-004 | Projectile system with auto-aim                | Not started |
| F-005 | XP gems, leveling, upgrade selection           | Not started |
| F-006 | Juice: screen shake, particles, damage numbers | Not started |
| F-007 | Polish: enemy variety, wave scaling, game over | Not started |

## What Will should understand after this project

1. Why delta time matters and how to use it correctly
2. What "game feel" means and how to implement it (screen shake, particles, flash, freeze frames)
3. How object pools work and why games use them
4. The update/render separation pattern
5. How spatial partitioning speeds up collision detection
6. How camera systems work (follow, shake, smoothing)
7. How sprite animation state machines work

## Learning pathway context

This is Project 1 of 5:

1. **Bullet Survivors** ← you are here
2. Dungeon of Echoes (roguelike, procedural generation)
3. Shader Sketchbook (GLSL art, shader fluency)
4. Tiny Hamlet (isometric builder, simulation + art direction)
5. Little World (3D diorama, visual polish capstone)

After all 5, Will returns to Radiate (3D evolution ecosystem sim) with full game dev fluency.

See `docs/game-dev-learning-pathway.md` in the Radiate repo for the full pathway document.
