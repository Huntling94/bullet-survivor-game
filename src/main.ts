const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

if (!ctx) {
  throw new Error("Could not get 2D rendering context");
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx.fillStyle = "#000";
ctx.fillRect(0, 0, canvas.width, canvas.height);
