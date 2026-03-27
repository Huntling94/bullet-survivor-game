# BRF-001: Project Scaffolding

## 1. Objective

**What it delivers:** A fully configured TypeScript + Vite project with automated quality gates, ready for game code.

**What it doesn't:** No game code. No canvas. No game loop. That's F-001.

**Why now:** Everything else depends on this. You can't write TypeScript without a compiler config. You can't catch bugs without linting. You can't refactor confidently without tests. And you can't enforce any of that without pre-commit hooks. Scaffolding is the foundation — get it right once, never think about it again.

### Why each tool exists (the learning bit)

| Tool                    | What it does                                             | Why you care                                                                                                                                                                               |
| ----------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **npm**                 | Package manager. Tracks dependencies and scripts.        | Single `npm install` reproduces your exact environment on any machine. Without it, "works on my machine" is your life.                                                                     |
| **TypeScript (strict)** | Adds types to JavaScript. Strict mode catches more bugs. | Games have lots of interacting systems. Types catch "I passed a position where it expected a velocity" at compile time, not at 2am when enemies fly off screen.                            |
| **Vite**                | Dev server with hot reload + production bundler.         | You change a file, the browser updates instantly. No manual refresh. This tight feedback loop matters enormously when tuning game feel — you need to see changes _immediately_.            |
| **Vitest**              | Test runner that understands Vite's config.              | Tests game logic (collision math, XP calculations, upgrade effects) without needing a browser. Fast feedback on whether your math is right.                                                |
| **ESLint**              | Static analysis. Catches code smells and bugs.           | Finds unused variables, unreachable code, accidental type coercion. Things that are technically valid JavaScript but almost certainly wrong.                                               |
| **Prettier**            | Code formatter. Makes style decisions for you.           | Eliminates all "tabs vs spaces" debates. Every file looks the same. You never think about formatting again — it just happens.                                                              |
| **Husky + lint-staged** | Runs checks before every `git commit`.                   | The safety net. Even when you're tired and just want to commit, these gates catch type errors, failing tests, and lint violations _before_ they land. You can't accidentally break things. |

## 2. Design decisions

### DD-1: Vite over alternatives

- **Problem:** Need a dev server and bundler for TypeScript.
- **Decision:** Vite.
- **Rationale:** Near-instant hot module replacement (HMR). Native TypeScript support. Vitest integrates directly. Minimal config. The alternatives (Webpack, Parcel, Rollup) are either slower, more complex, or both.
- **Consequence:** Vite-specific config files (`vite.config.ts`). Dev server on `localhost:5173` by default.

### DD-2: Strict TypeScript configuration

- **Problem:** TypeScript has many strictness levels. How strict?
- **Decision:** Maximum strictness — `strict: true` plus additional checks.
- **Rationale:** Strict mode catches: uninitialized variables, implicit `any` types, unchecked null access, and missing return types on complex functions. These are exactly the bugs that cause "why is my enemy spawning at position `undefined`?" Every bug caught at compile time is a bug you don't debug at runtime.
- **Consequence:** More type annotations required. Occasionally annoying. Always worth it.

### DD-3: ESLint flat config format

- **Problem:** ESLint has two config formats — legacy (`.eslintrc`) and flat (`eslint.config.js`).
- **Decision:** Flat config. It's the current default and the only format going forward.
- **Rationale:** Legacy config is deprecated. Starting with flat config means no migration later.
- **Consequence:** Config is a plain `.js` file that exports an array. More explicit, less magic.

### DD-4: Pre-commit hooks over CI-only checks

- **Problem:** When should quality gates run — on commit, on push, or in CI?
- **Decision:** On commit (Husky + lint-staged), with all four gates: typecheck, test, lint, format.
- **Rationale:** The earlier you catch a bug, the cheaper it is. Catching a type error 0.5 seconds after committing is infinitely better than catching it 5 minutes later in CI, or never. The tradeoff is slightly slower commits — but "slow commit" means 3-5 seconds, and every one of those seconds is preventing a future debugging session.
- **Consequence:** Every commit is guaranteed to typecheck, pass tests, lint clean, and be formatted. You can trust any commit in the history.

### DD-5: Test co-location over `__tests__` directory

- **Problem:** Where do test files live?
- **Decision:** Next to the code they test. `player.ts` sits beside `player.test.ts`.
- **Rationale:** When you open a file, its tests are right there. No navigating to a parallel directory tree. When you delete a module, the test goes with it. Proximity encourages testing — if the test file is far away, you'll "do it later."
- **Consequence:** Test files scattered through `src/`. Vitest finds them by pattern (`**/*.test.ts`).

## 3. File changes

| File                | Action                  | Purpose                                   | Risk                  |
| ------------------- | ----------------------- | ----------------------------------------- | --------------------- |
| `package.json`      | Create                  | Dependencies, scripts, project metadata   | Low — foundational    |
| `tsconfig.json`     | Create                  | TypeScript compiler config                | Low — strict defaults |
| `vite.config.ts`    | Create                  | Vite dev server + build config            | Low — minimal config  |
| `eslint.config.js`  | Create                  | Linting rules                             | Low                   |
| `.prettierrc`       | Create                  | Formatting config                         | Low                   |
| `.gitignore`        | Create                  | Exclude `node_modules/`, `dist/`          | Low                   |
| `src/main.ts`       | Create                  | Empty entry point (Vite requires one)     | Low                   |
| `index.html`        | Create                  | HTML shell with `<canvas>` and `<script>` | Low                   |
| `.husky/pre-commit` | Create (via husky init) | Pre-commit hook script                    | Low                   |

**Overall risk: Low.** This is all configuration. Nothing here is hard to change later.

## 4. Implementation plan

Single commit — this is all interconnected config that doesn't make sense split up.

**Commit 1:** `scaffold: configure TypeScript, Vite, Vitest, ESLint, Prettier, Husky`

- `npm init`, install all dependencies
- Create TypeScript config (strict)
- Create Vite config
- Create ESLint + Prettier configs
- Create `.gitignore`
- Create minimal `index.html` with `<canvas>` element
- Create empty `src/main.ts` entry point
- Set up Husky + lint-staged pre-commit hooks
- Verify: `npm run dev` serves a blank page, `npm run build` succeeds, `npx tsc --noEmit` passes, `npm test` runs (no tests yet, but the runner works)

## 5. Test strategy

No game logic yet, so no tests to write. But the test _infrastructure_ must work:

- `npm test` runs Vitest and exits cleanly (0 tests, 0 failures)
- `npx tsc --noEmit` passes with no errors
- `npm run build` produces a `dist/` folder
- `npm run dev` serves `index.html` on localhost
- Pre-commit hook rejects a commit with a deliberate type error (manual verification)

## 6. Risks & mitigations

| Risk                             | Severity | Likelihood | Mitigation                                                              |
| -------------------------------- | -------- | ---------- | ----------------------------------------------------------------------- |
| Dependency version conflicts     | Low      | Low        | Pin exact versions in `package.json`                                    |
| Husky not triggering on Windows  | Medium   | Medium     | Test hook manually after setup. Husky v9+ has improved Windows support. |
| ESLint + Prettier rule conflicts | Low      | Medium     | Use `eslint-config-prettier` to disable conflicting ESLint style rules  |

## 7. Acceptance criteria

- [ ] `npm run dev` starts Vite dev server, serves `index.html` with a `<canvas>` element
- [ ] `npm run build` produces production output in `dist/`
- [ ] `npx tsc --noEmit` exits with code 0
- [ ] `npm test` runs Vitest successfully (0 tests passing)
- [ ] `npm run lint` exits clean
- [ ] `npm run format:check` exits clean
- [ ] Pre-commit hook runs all four gates on `git commit`
- [ ] `.gitignore` excludes `node_modules/` and `dist/`
