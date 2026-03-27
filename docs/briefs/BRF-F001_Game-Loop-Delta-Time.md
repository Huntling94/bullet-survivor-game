# BRF-F001: Canvas + Game Loop with Delta Time (Retroactive)

> This brief was written retroactively to document the solution design for learning reference.

## 1. Objective

First real game code. Establishes the game loop, delta time, FPS counter, and Vector2 utility.

## 2. Solution design

### Interfaces and types

```typescript
// src/utils/vector2.ts — Immutable 2D math. Every position, velocity, and direction in the game uses this.
class Vector2 {
  readonly x: number;
  readonly y: number;
  static readonly ZERO: Vector2;

  add(other: Vector2): Vector2; // returns new Vector2, doesn't mutate
  subtract(other: Vector2): Vector2;
  scale(scalar: number): Vector2;
  magnitude(): number; // √(x² + y²)
  normalize(): Vector2; // unit vector, or ZERO if magnitude is 0
  distanceTo(other: Vector2): number;
  dot(other: Vector2): number;
  equals(other: Vector2): boolean;
  clone(): Vector2;
}
```

### Key classes

```typescript
// src/game.ts — Game state orchestrator. Never touches the DOM.
class Game {
  width: number;
  height: number;
  fps: number;

  constructor(width: number, height: number);
  resize(width: number, height: number): void;
  update(dt: number): void; // modifies state
  render(ctx: CanvasRenderingContext2D): void; // reads state, draws
}
```

### Key logic: the game loop (src/main.ts)

```typescript
const MAX_DELTA_TIME = 0.1; // clamp to prevent physics explosions on tab-switch
let lastTime = -1;

function loop(timestamp: number): void {
  if (lastTime < 0) {
    // skip first frame (no valid dt yet)
    lastTime = timestamp;
    requestAnimationFrame(loop);
    return;
  }

  const dtMs = timestamp - lastTime;
  lastTime = timestamp;
  const dt = Math.min(dtMs / 1000, MAX_DELTA_TIME); // ms → seconds, clamped

  game.update(dt);
  game.render(renderCtx);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
```

**Why this works:**

- `requestAnimationFrame` gives a high-precision timestamp in ms
- `dt = (now - last) / 1000` converts to seconds
- `Math.min(dt, 0.1)` caps at 100ms — if the tab was backgrounded for 5s, the game slows down instead of teleporting everything
- First frame is skipped because `lastTime` starts at -1 (no previous timestamp to diff against)

### Key logic: FPS counter (rolling average)

```typescript
// Inside Game.update(dt):
this.fpsAccumulator += dt;
this.fpsFrameCount++;

if (this.fpsAccumulator >= 0.5) {
  // recalculate every 0.5 seconds
  this.fps = Math.round(this.fpsFrameCount / this.fpsAccumulator);
  this.fpsAccumulator = 0;
  this.fpsFrameCount = 0;
}
```

**Why rolling average, not per-frame?** Per-frame FPS jumps wildly (59, 62, 58, 61...). The rolling average over 0.5s produces a stable, readable number.

### Architecture pattern: update/render separation

```
update(dt)  →  modifies game state (positions, health, timers)
render(ctx) →  reads game state, draws to canvas

Never mix: render() must not change state, update() must not draw.
```

This separation means:

1. Game logic is testable without a canvas
2. Update and render can later run at different rates
3. Forces clean thinking about what is "state" vs "visual"
