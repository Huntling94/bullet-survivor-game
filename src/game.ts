import { Player } from "./entities/player";
import { Enemy, ENEMY_CONFIGS } from "./entities/enemy";
import { Projectile } from "./entities/projectile";
import { Weapon } from "./entities/weapon";
import { XpGem } from "./entities/xp-gem";
import { Camera } from "./systems/camera";
import { InputHandler } from "./systems/input";
import { Spawner } from "./systems/spawner";
import { LevelingSystem } from "./systems/leveling";
import {
  checkPlayerEnemyCollisions,
  checkProjectileEnemyCollisions,
  findNearestEnemy,
} from "./systems/collision";
import { ObjectPool } from "./utils/object-pool";

const FPS_UPDATE_INTERVAL = 0.5;
const FPS_FONT = "14px monospace";
const FPS_COLOR = "#0f0";
const HUD_FONT = "14px monospace";
const HUD_COLOR = "#fff";
const GAME_OVER_FONT = "48px monospace";
const GAME_OVER_SUB_FONT = "18px monospace";
const GAME_OVER_COLOR = "#e53935";
const UPGRADE_CARD_FONT = "16px monospace";
const UPGRADE_DESC_FONT = "12px monospace";
const UPGRADE_KEY_FONT = "14px monospace";
const FPS_X = 10;
const FPS_Y = 20;
const WAVE_HUD_X = 10;
const WAVE_HUD_Y = 40;
const INITIAL_PROJECTILE_POOL = 20;
const INITIAL_GEM_POOL = 30;
const XP_BAR_HEIGHT = 8;
const XP_BAR_MARGIN = 30;
const UPGRADE_CARD_WIDTH = 180;
const UPGRADE_CARD_HEIGHT = 80;
const UPGRADE_CARD_GAP = 20;

export class Game {
  width: number;
  height: number;
  fps: number = 0;

  readonly player: Player;
  readonly camera: Camera;
  readonly spawner: Spawner;
  readonly weapon: Weapon;
  readonly leveling: LevelingSystem;
  readonly projectilePool: ObjectPool<Projectile>;
  readonly gemPool: ObjectPool<XpGem>;
  enemies: Enemy[] = [];
  gameOver: boolean = false;
  paused: boolean = false;
  private survivalTime: number = 0;
  private readonly input: InputHandler;

  private fpsAccumulator: number = 0;
  private fpsFrameCount: number = 0;

  constructor(width: number, height: number, input: InputHandler) {
    this.width = width;
    this.height = height;
    this.input = input;
    this.player = new Player();
    this.camera = new Camera();
    this.spawner = new Spawner();
    this.weapon = new Weapon();
    this.leveling = new LevelingSystem();
    this.projectilePool = new ObjectPool<Projectile>(
      () => new Projectile(),
      (p) => p.deactivate(),
      INITIAL_PROJECTILE_POOL,
    );
    this.gemPool = new ObjectPool<XpGem>(
      () => new XpGem(),
      (g) => g.deactivate(),
      INITIAL_GEM_POOL,
    );

    this.input.onKeyDown((key: string) => {
      if (!this.paused || !this.leveling.pendingUpgradeChoices) return;
      const index = ["1", "2", "3"].indexOf(key);
      if (index === -1) return;
      this.leveling.applyUpgrade(index, this.player, this.weapon.stats);
      this.paused = false;
    });
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  update(dt: number): void {
    if (this.gameOver || this.paused) return;

    this.player.update(dt, this.input);
    this.survivalTime += dt;

    // Weapon auto-fire
    this.weapon.update(dt);
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
          {
            speed: this.weapon.stats.projectileSpeed,
            damage: this.weapon.stats.damage,
            maxRange: this.weapon.stats.range,
            radius: this.weapon.stats.projectileRadius,
            color: "#ffeb3b",
          },
          this.weapon.stats.pierce,
        );
        this.weapon.resetFireTimer();
      }
    }

    // Spawn enemies
    const activeCount = this.enemies.filter((e) => e.active).length;
    const instructions = this.spawner.update(
      dt,
      this.player.position,
      this.width,
      this.height,
      activeCount,
    );
    for (const inst of instructions) {
      this.enemies.push(new Enemy(inst.position, ENEMY_CONFIGS[inst.type]));
    }

    // Update enemies
    for (const enemy of this.enemies) {
      enemy.update(dt, this.player.position);
    }

    // Update projectiles
    for (const projectile of this.projectilePool.getActive()) {
      projectile.update(dt);
    }

    // Projectile-enemy collision
    checkProjectileEnemyCollisions(
      this.projectilePool.getActive(),
      this.enemies,
    );

    // Release inactive projectiles back to pool
    for (const projectile of [...this.projectilePool.getActive()]) {
      if (!projectile.active) {
        this.projectilePool.release(projectile);
      }
    }

    // Spawn XP gems for killed enemies (before filtering)
    for (const enemy of this.enemies) {
      if (enemy.killed) {
        const gem = this.gemPool.acquire();
        gem.activate(enemy.position, enemy.config.xpValue);
      }
    }

    // Despawn far enemies
    const despawnRadius = this.spawner.getDespawnRadius(
      this.width,
      this.height,
    );
    for (const enemy of this.enemies) {
      if (
        enemy.active &&
        enemy.position.distanceTo(this.player.position) > despawnRadius
      ) {
        enemy.active = false;
      }
    }

    // Remove inactive enemies from array
    this.enemies = this.enemies.filter((e) => e.active);

    // Update and collect XP gems
    let leveledUp = false;
    for (const gem of [...this.gemPool.getActive()]) {
      const collected = gem.update(
        dt,
        this.player.position,
        this.player.pickupRadius,
      );
      if (collected) {
        if (this.leveling.addXp(gem.xpValue)) {
          leveledUp = true;
        }
        this.gemPool.release(gem);
      } else if (
        gem.active &&
        gem.position.distanceTo(this.player.position) > despawnRadius
      ) {
        this.gemPool.release(gem);
      }
    }

    // Level up pause
    if (leveledUp) {
      this.leveling.pendingUpgradeChoices = this.leveling.generateChoices();
      this.paused = true;
      return;
    }

    // Player-enemy collision
    checkPlayerEnemyCollisions(this.player, this.enemies);

    // Check death
    if (this.player.health <= 0) {
      this.gameOver = true;
      return;
    }

    // Camera
    this.camera.update(this.player.position, dt);

    // FPS
    this.fpsAccumulator += dt;
    this.fpsFrameCount++;
    if (this.fpsAccumulator >= FPS_UPDATE_INTERVAL) {
      this.fps = Math.round(this.fpsFrameCount / this.fpsAccumulator);
      this.fpsAccumulator = 0;
      this.fpsFrameCount = 0;
    }
  }

  private renderGrid(ctx: CanvasRenderingContext2D): void {
    const gridSize = 64;
    const color = "#1a1a1a";

    const startX =
      Math.floor((this.camera.position.x - this.width / 2) / gridSize) *
      gridSize;
    const startY =
      Math.floor((this.camera.position.y - this.height / 2) / gridSize) *
      gridSize;
    const endX = startX + this.width + gridSize;
    const endY = startY + this.height + gridSize;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }

  private renderXpBar(ctx: CanvasRenderingContext2D): void {
    const barWidth = this.width * 0.6;
    const barX = (this.width - barWidth) / 2;
    const barY = this.height - XP_BAR_MARGIN;

    ctx.fillStyle = "#333";
    ctx.fillRect(barX, barY, barWidth, XP_BAR_HEIGHT);
    ctx.fillStyle = "#7c4dff";
    ctx.fillRect(
      barX,
      barY,
      barWidth * this.leveling.xpProgress,
      XP_BAR_HEIGHT,
    );

    ctx.fillStyle = HUD_COLOR;
    ctx.font = HUD_FONT;
    ctx.textAlign = "right";
    ctx.fillText(`Lv ${this.leveling.level}`, barX - 8, barY + XP_BAR_HEIGHT);
    ctx.textAlign = "start";
  }

  private renderUpgradeUI(ctx: CanvasRenderingContext2D): void {
    const choices = this.leveling.pendingUpgradeChoices;
    if (!choices) return;

    // Overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, this.width, this.height);

    // Title
    ctx.fillStyle = "#ffeb3b";
    ctx.font = GAME_OVER_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LEVEL UP!", this.width / 2, this.height / 2 - 100);

    // Cards
    const totalWidth =
      choices.length * UPGRADE_CARD_WIDTH +
      (choices.length - 1) * UPGRADE_CARD_GAP;
    const startX = (this.width - totalWidth) / 2;
    const cardY = this.height / 2 - 20;

    for (let i = 0; i < choices.length; i++) {
      const choice = choices[i];
      if (!choice) continue;
      const cardX = startX + i * (UPGRADE_CARD_WIDTH + UPGRADE_CARD_GAP);

      // Card background
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(cardX, cardY, UPGRADE_CARD_WIDTH, UPGRADE_CARD_HEIGHT);
      ctx.strokeStyle = "#7c4dff";
      ctx.lineWidth = 2;
      ctx.strokeRect(cardX, cardY, UPGRADE_CARD_WIDTH, UPGRADE_CARD_HEIGHT);

      // Card content
      ctx.fillStyle = HUD_COLOR;
      ctx.font = UPGRADE_CARD_FONT;
      ctx.textAlign = "center";
      ctx.fillText(choice.name, cardX + UPGRADE_CARD_WIDTH / 2, cardY + 25);

      ctx.fillStyle = "#aaa";
      ctx.font = UPGRADE_DESC_FONT;
      ctx.fillText(
        choice.description,
        cardX + UPGRADE_CARD_WIDTH / 2,
        cardY + 48,
      );

      ctx.fillStyle = "#7c4dff";
      ctx.font = UPGRADE_KEY_FONT;
      ctx.fillText(`[${i + 1}]`, cardX + UPGRADE_CARD_WIDTH / 2, cardY + 68);
    }

    ctx.textAlign = "start";
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Clear entire screen
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.width, this.height);

    // World space rendering (inside camera transform)
    this.camera.applyTransform(ctx, this.width, this.height);
    this.renderGrid(ctx);
    for (const gem of this.gemPool.getActive()) {
      gem.render(ctx);
    }
    for (const projectile of this.projectilePool.getActive()) {
      projectile.render(ctx);
    }
    for (const enemy of this.enemies) {
      enemy.render(ctx);
    }
    this.player.render(ctx);
    this.camera.resetTransform(ctx);

    // Screen space rendering (HUD)
    ctx.fillStyle = FPS_COLOR;
    ctx.font = FPS_FONT;
    ctx.textBaseline = "top";
    ctx.fillText(`FPS: ${this.fps}`, FPS_X, FPS_Y);

    ctx.fillStyle = HUD_COLOR;
    ctx.font = HUD_FONT;
    ctx.fillText(`Wave ${this.spawner.waveNumber}`, WAVE_HUD_X, WAVE_HUD_Y);

    this.renderXpBar(ctx);

    // Upgrade selection overlay
    if (this.paused && this.leveling.pendingUpgradeChoices) {
      this.renderUpgradeUI(ctx);
    }

    // Game over overlay
    if (this.gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = GAME_OVER_COLOR;
      ctx.font = GAME_OVER_FONT;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("GAME OVER", this.width / 2, this.height / 2 - 30);

      const seconds = Math.floor(this.survivalTime);
      ctx.fillStyle = HUD_COLOR;
      ctx.font = GAME_OVER_SUB_FONT;
      ctx.fillText(
        `Lv ${this.leveling.level} | Wave ${this.spawner.waveNumber} | ${seconds}s`,
        this.width / 2,
        this.height / 2 + 20,
      );
      ctx.fillText("Refresh to restart", this.width / 2, this.height / 2 + 50);

      ctx.textAlign = "start";
    }
  }
}
