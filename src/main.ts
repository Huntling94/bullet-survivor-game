import { Game } from "./game";

const MAX_DELTA_TIME = 0.1;

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

if (!ctx) {
  throw new Error("Could not get 2D rendering context");
}

// ctx is narrowed to CanvasRenderingContext2D after the throw above,
// but TypeScript loses this in the closure below. Re-bind to a const
// that TypeScript knows is non-null.
const renderCtx: CanvasRenderingContext2D = ctx;

const game = new Game(window.innerWidth, window.innerHeight);

function handleResize(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  game.resize(canvas.width, canvas.height);
}

handleResize();
window.addEventListener("resize", handleResize);

let lastTime = -1;

function loop(timestamp: number): void {
  if (lastTime < 0) {
    lastTime = timestamp;
    requestAnimationFrame(loop);
    return;
  }

  const dtMs = timestamp - lastTime;
  lastTime = timestamp;
  const dt = Math.min(dtMs / 1000, MAX_DELTA_TIME);

  game.update(dt);
  game.render(renderCtx);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
