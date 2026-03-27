# BRF-002: Player Movement with Camera Follow

## 1. Objective

**What it delivers:** A player circle you control with WASD/arrow keys on an infinite field, with the camera following. The first thing that _feels_ like a game.

**What it doesn't:** No enemies, no projectiles, no health loss. Just movement and camera.

**Why now:** This is step 2 of the implementation order. It introduces the entity pattern, input handling, and camera system — three foundations that every future feature depends on.

### New concepts introduced

| Concept                    | What it is                                                                     | Why it matters                                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Input handling**         | Tracking which keys are held down each frame                                   | Every game needs input. The pattern here (interface for testability, concrete class for DOM) carries to mouse, gamepad, touch.                                                          |
| **Entity pattern**         | A game object with position, velocity, update(), render()                      | Player is the first. Enemies, projectiles, XP gems all follow the same shape. Getting this right now sets the template.                                                                 |
| **Camera system**          | Translating world coordinates to screen coordinates                            | Without a camera, the player walks off the edge of the screen. The camera makes the world feel infinite by keeping the player centered.                                                 |
| **Diagonal normalization** | Ensuring diagonal movement isn't faster than cardinal                          | If you press W+D, the raw direction is (1,-1) with magnitude √2 ≈ 1.41. Without normalizing, you'd move 41% faster diagonally. Every game with 8-directional movement must handle this. |
| **World vs screen space**  | Two coordinate systems — world (where things are) and screen (where they draw) | Entities exist in world space. The camera transforms world→screen for rendering. HUD elements skip the camera and draw directly in screen space.                                        |

## 2. Design decisions

### DD-1: Input as an interface, not a class dependency

- **Problem:** Game.update() needs to know which keys are pressed, but DOM events live in main.ts.
- **Decision:** Define an `InputState` interface (`{ up, down, left, right }`). Game depends on the interface. `InputHandler` is the concrete class that listens to keydown/keyup.
- **Rationale:** This is _dependency inversion_ — the most important testability pattern. In tests, you pass `{ up: true, down: false, left: false, right: false }` — no DOM, no mocking. In production, main.ts creates the real InputHandler and injects it.
- **Consequence:** Game never touches the DOM. This pattern extends to any future browser dependency (audio, storage, mouse).

### DD-2: Camera with instant follow (smooth follow deferred to juice pass)

- **Problem:** Should the camera snap to the player or smoothly lerp?
- **Decision:** Instant snap for now. Camera center = player position.
- **Rationale:** Smooth follow uses `lerp(current, target, factor * dt)`, which has a subtle bug: the lerp factor behaves differently at different frame rates unless you use exponential smoothing. That's a juice pass topic (F-006). Starting with snap is correct, simple, and testable. The camera class has a `dt` parameter ready for when smooth follow is added — one line changes.
- **Consequence:** Camera class has `update(target, dt)` API from day one. Clean upgrade path.

### DD-3: No base Entity class yet

- **Problem:** Should Player extend a base Entity type?
- **Decision:** No. Player is a standalone class. When Enemy arrives in F-003, we extract the shared pattern, informed by two real examples.
- **Rationale:** "Rule of Three" — abstract after you see the pattern repeated, not before. Premature abstraction leads to wrong abstractions. After F-003, the shared shape (position, velocity, radius, update, render) will be obvious.
- **Consequence:** Small refactor at the start of F-003. This is intentional — it teaches refactoring driven by real needs.

### DD-4: InputHandler exposes handleKeyDown/handleKeyUp methods

- **Problem:** How to test InputHandler without jsdom?
- **Decision:** InputHandler has public `handleKeyDown(key)` and `handleKeyUp(key)` methods. Tests call these directly. `bindEvents()` is a thin wrapper that wires `addEventListener` to call them.
- **Rationale:** Avoids adding jsdom as a dependency. The logic (key mapping, state tracking) is tested directly. The wiring (addEventListener) is one line that's hard to get wrong.
- **Consequence:** No new dependencies. Tests are fast and simple.

### DD-5: Canvas convention for Y-axis (down is positive)

- **Problem:** Mathematical convention has Y-up. Canvas has Y-down. Which do we use?
- **Decision:** Y-down everywhere. Pressing W (up) decreases Y. Pressing S (down) increases Y.
- **Rationale:** Fighting the canvas convention causes endless sign-flip bugs. Every Canvas tutorial, every MDN doc, every Stack Overflow answer uses Y-down. Go with it.
- **Consequence:** "Up" in the game world is negative Y. This is normal for 2D Canvas games.

## 3. File changes

| File                          | Action | What it does                                         | Risk                                    |
| ----------------------------- | ------ | ---------------------------------------------------- | --------------------------------------- |
| `src/systems/input.ts`        | Create | InputState interface + InputHandler class            | Low                                     |
| `src/systems/input.test.ts`   | Create | Tests for key mapping and state tracking             | Low                                     |
| `src/entities/player.ts`      | Create | Player class with position, movement, health, render | Low                                     |
| `src/entities/player.test.ts` | Create | Tests for movement, diagonal normalization, health   | Low                                     |
| `src/systems/camera.ts`       | Create | Camera with follow + ctx.translate transform         | Low                                     |
| `src/systems/camera.test.ts`  | Create | Tests for transform math                             | Low                                     |
| `src/game.ts`                 | Modify | Orchestrate player, camera, input                    | Medium — changing existing working code |
| `src/game.test.ts`            | Modify | Update tests for new constructor sig                 | Low                                     |
| `src/main.ts`                 | Modify | Create InputHandler, pass to Game                    | Low                                     |

## 4. Implementation plan

### Commit 1: `add input system with keyboard handler and testable interface`

- `src/systems/input.ts` — InputState interface, InputHandler class
- `src/systems/input.test.ts` — Key mapping, state tracking, blur clearing

### Commit 2: `add player entity with movement and health bar`

- `src/entities/player.ts` — Player class with position, update(dt, input), render(ctx)
- `src/entities/player.test.ts` — Movement direction, speed, diagonal normalization

### Commit 3: `add camera system with world-to-screen transform`

- `src/systems/camera.ts` — Camera class with applyTransform/resetTransform
- `src/systems/camera.test.ts` — Transform math verification

### Commit 4: `integrate player, camera, and input into game loop`

- `src/game.ts` — Orchestrate all systems
- `src/game.test.ts` — Updated for new constructor, integration tests
- `src/main.ts` — Create InputHandler, inject into Game

## 5. Test strategy

| What                     | How                                                                      | Why it matters               |
| ------------------------ | ------------------------------------------------------------------------ | ---------------------------- |
| WASD key mapping         | Call handleKeyDown("w"), check up === true                               | Prove keys map to directions |
| Arrow key mapping        | Call handleKeyDown("ArrowUp"), check up === true                         | Both control schemes work    |
| Diagonal normalization   | Update with up+right for 1s, check displacement magnitude = PLAYER_SPEED | The key correctness test     |
| Zero input = no movement | Update with all-false input, position unchanged                          | Edge case                    |
| Camera transform math    | Camera at (100, 200), screen 800×600, verify translate(300, 100)         | World→screen conversion      |
| Game orchestration       | Update with right input, verify player moved right                       | Integration                  |

## 6. Risks & mitigations

| Risk                              | Severity | Likelihood | Mitigation                                             |
| --------------------------------- | -------- | ---------- | ------------------------------------------------------ |
| Breaking existing FPS display     | Low      | Medium     | FPS renders after camera.resetTransform (screen space) |
| Key stuck on tab-switch           | Low      | High       | InputHandler clears all keys on window blur            |
| Float precision in movement tests | Low      | Medium     | Use toBeCloseTo() not toBe() for position assertions   |

## 7. Solution design (retroactive)

### Interfaces and types

```typescript
// src/systems/input.ts — Testable contract for input state
interface InputState {
  readonly up: boolean;
  readonly down: boolean;
  readonly left: boolean;
  readonly right: boolean;
}

// In tests, just pass a plain object:
//   { up: true, down: false, left: false, right: false }
// In production, InputHandler (which implements InputState) is injected.
```

### Key classes

```typescript
// src/systems/input.ts — Concrete DOM implementation
class InputHandler implements InputState {
  private keys: Set<keyof InputState>;

  get up(): boolean; // computed from key set
  get down(): boolean;
  get left(): boolean;
  get right(): boolean;

  handleKeyDown(key: string): void; // maps WASD/arrows → direction
  handleKeyUp(key: string): void;
  clearAll(): void; // called on window blur
  bindEvents(target: Window): void; // thin wrapper over addEventListener
}

// src/entities/player.ts — First entity. Sets the pattern for all others.
class Player {
  position: Vector2;
  readonly radius: number; // = 16
  readonly maxHealth: number; // = 100
  health: number;

  update(dt: number, input: InputState): void;
  render(ctx: CanvasRenderingContext2D): void;
}

// src/systems/camera.ts — World-to-screen coordinate transform
class Camera {
  position: Vector2;

  update(target: Vector2, _dt: number): void; // snap to target (dt reserved for smooth follow)
  applyTransform(ctx, screenWidth, screenHeight): void; // ctx.save() + ctx.translate()
  resetTransform(ctx): void; // ctx.restore()
}
```

### Key logic: diagonal normalization (src/entities/player.ts)

```typescript
update(dt: number, input: InputState): void {
  let dx = 0, dy = 0;
  if (input.up)    dy -= 1;   // up = negative Y (canvas convention)
  if (input.down)  dy += 1;
  if (input.left)  dx -= 1;
  if (input.right) dx += 1;

  const direction = new Vector2(dx, dy).normalize();  // ← this is the key line
  this.position = this.position.add(direction.scale(PLAYER_SPEED * dt));
}
```

**Why normalize?** Without it, pressing W+D gives direction (1, -1) with magnitude √2 ≈ 1.41. You'd move 41% faster diagonally. `normalize()` scales it to magnitude 1, so `PLAYER_SPEED * dt` is the same in all 8 directions. The `normalize()` also handles the zero-vector case (no keys pressed → ZERO → no movement) with no special case needed.

### Key logic: camera transform bracket (src/game.ts render)

```typescript
render(ctx: CanvasRenderingContext2D): void {
  ctx.fillRect(0, 0, this.width, this.height);  // clear

  // Everything between these two calls draws in WORLD coordinates
  this.camera.applyTransform(ctx, this.width, this.height);
    this.renderGrid(ctx);     // world space
    this.player.render(ctx);  // world space
  this.camera.resetTransform(ctx);

  // Everything after draws in SCREEN coordinates
  ctx.fillText(`FPS: ${this.fps}`, 10, 20);  // screen space
}
```

**The math inside applyTransform:**

```typescript
ctx.translate(screenWidth / 2 - camera.x, screenHeight / 2 - camera.y);
```

If the camera is at world position (100, 200) on an 800×600 screen, this translates by (300, 100). A game object at world (100, 200) would draw at screen (400, 300) — the center. That's the whole trick.

### Dependency injection pattern (src/main.ts → src/game.ts)

```typescript
// main.ts creates the DOM-coupled object
const input = new InputHandler();
input.bindEvents(window);

// Game receives the interface, not the class
const game = new Game(width, height, input); // input typed as InputState
```

Game never touches the DOM. This pattern repeats for every future browser dependency.

## 8. Acceptance criteria

- [ ] WASD and arrow keys move a circle on screen
- [ ] Movement speed is consistent in all 8 directions (diagonal normalized)
- [ ] Camera follows player — player stays centered
- [ ] FPS counter still visible in top-left (screen space, not world space)
- [ ] Window resize works correctly
- [ ] All tests pass (`npm test`)
- [ ] All pre-commit gates pass
- [ ] `npm run build` succeeds
