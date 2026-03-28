import { Vector2 } from "../utils/vector2";
import { EnemyType } from "../entities/enemy";

const INITIAL_SPAWN_INTERVAL = 2.0;
const MIN_SPAWN_INTERVAL = 0.4;
const SPAWN_INTERVAL_DECAY = 0.85;
const MAX_ENEMIES_BASE = 50;
const MAX_ENEMIES_PER_WAVE = 5;
const WAVE_DURATION = 30;
const SPAWN_MARGIN = 50;
const DESPAWN_RADIUS_MULTIPLIER = 2.0;
const RUNNER_INTRODUCTION_WAVE = 2;
const RUNNER_CHANCE_PER_WAVE = 0.15;

export interface SpawnInstruction {
  type: EnemyType;
  position: Vector2;
}

export class Spawner {
  waveNumber: number = 1;
  private waveTimer: number = 0;
  private spawnTimer: number = 0;
  private spawnInterval: number = INITIAL_SPAWN_INTERVAL;

  get maxEnemies(): number {
    return MAX_ENEMIES_BASE + (this.waveNumber - 1) * MAX_ENEMIES_PER_WAVE;
  }

  update(
    dt: number,
    playerPosition: Vector2,
    screenWidth: number,
    screenHeight: number,
    activeEnemyCount: number,
  ): SpawnInstruction[] {
    const instructions: SpawnInstruction[] = [];

    // Advance wave timer
    this.waveTimer += dt;
    if (this.waveTimer >= WAVE_DURATION) {
      this.waveTimer -= WAVE_DURATION;
      this.waveNumber++;
      this.spawnInterval = Math.max(
        MIN_SPAWN_INTERVAL,
        this.spawnInterval * SPAWN_INTERVAL_DECAY,
      );
    }

    // Advance spawn timer
    this.spawnTimer += dt;
    while (
      this.spawnTimer >= this.spawnInterval &&
      activeEnemyCount + instructions.length < this.maxEnemies
    ) {
      this.spawnTimer -= this.spawnInterval;
      const position = this.getSpawnPosition(
        playerPosition,
        screenWidth,
        screenHeight,
      );
      const type = this.pickEnemyType();
      instructions.push({ type, position });
    }

    return instructions;
  }

  getDespawnRadius(screenWidth: number, screenHeight: number): number {
    const spawnRadius = this.getSpawnRadius(screenWidth, screenHeight);
    return spawnRadius * DESPAWN_RADIUS_MULTIPLIER;
  }

  private getSpawnRadius(screenWidth: number, screenHeight: number): number {
    return (
      Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight) / 2 +
      SPAWN_MARGIN
    );
  }

  private getSpawnPosition(
    playerPosition: Vector2,
    screenWidth: number,
    screenHeight: number,
  ): Vector2 {
    const radius = this.getSpawnRadius(screenWidth, screenHeight);
    const angle = Math.random() * Math.PI * 2;
    return new Vector2(
      playerPosition.x + Math.cos(angle) * radius,
      playerPosition.y + Math.sin(angle) * radius,
    );
  }

  private pickEnemyType(): EnemyType {
    if (this.waveNumber < RUNNER_INTRODUCTION_WAVE) {
      return "shambler";
    }
    const runnerChance =
      (this.waveNumber - RUNNER_INTRODUCTION_WAVE + 1) * RUNNER_CHANCE_PER_WAVE;
    return Math.random() < runnerChance ? "runner" : "shambler";
  }
}
