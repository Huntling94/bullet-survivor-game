export interface InputState {
  readonly up: boolean;
  readonly down: boolean;
  readonly left: boolean;
  readonly right: boolean;
}

const KEY_MAP: Record<string, keyof InputState> = {
  w: "up",
  arrowup: "up",
  s: "down",
  arrowdown: "down",
  a: "left",
  arrowleft: "left",
  d: "right",
  arrowright: "right",
};

export class InputHandler implements InputState {
  private keys = new Set<keyof InputState>();

  get up(): boolean {
    return this.keys.has("up");
  }
  get down(): boolean {
    return this.keys.has("down");
  }
  get left(): boolean {
    return this.keys.has("left");
  }
  get right(): boolean {
    return this.keys.has("right");
  }

  handleKeyDown(key: string): void {
    const direction = KEY_MAP[key.toLowerCase()];
    if (direction) {
      this.keys.add(direction);
    }
  }

  handleKeyUp(key: string): void {
    const direction = KEY_MAP[key.toLowerCase()];
    if (direction) {
      this.keys.delete(direction);
    }
  }

  clearAll(): void {
    this.keys.clear();
  }

  bindEvents(target: Window): void {
    target.addEventListener("keydown", (e) => this.handleKeyDown(e.key));
    target.addEventListener("keyup", (e) => this.handleKeyUp(e.key));
    target.addEventListener("blur", () => this.clearAll());
  }
}
