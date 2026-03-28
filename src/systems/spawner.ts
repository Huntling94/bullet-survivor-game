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
const SWARM_INTRODUCTION_WAVE = 3;
const TANK_INTRODUCTION_WAVE = 4;
const RUNNER_CHANCE_PER_WAVE = 0.15;
const SWARM_CHANCE_PER_WAVE = 0.12;
const TANK_CHANCE_PER_WAVE = 0.08;
const SWARM_CLUSTER_MIN = 3;
const SWARM_CLUSTER_MAX = 5;
const SWARM_CLUSTER_SPREAD = 20;
const STAT_SCALE_PER_WAVE = 0.05;

export interface SpawnInstruction {
  type: EnemyType;
  position: Vector2;
  statScale: number;
}

export class Spawner {
  waveNumber: number = 1;
  private waveTimer: number = 0;
  private spawnTimer: number = 0;
  private spawnInterval: number = INITIAL_SPAWN_INTERVAL;

  get maxEnemies(): number {
    return MAX_ENEMIES_BASE + (this.waveNumber - 1) * MAX_ENEMIES_PER_WAVE;
  }

  get statScale(): number {
    return 1 + (this.waveNumber - 1) * STAT_SCALE_PER_WAVE;
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
      const pick = this.pickEnemyType();

      if (pick.count > 1) {
        // Cluster spawn (swarm): slight position variation
        for (let i = 0; i < pick.count; i++) {
          const offset = new Vector2(
            (Math.random() - 0.5) * SWARM_CLUSTER_SPREAD * 2,
            (Math.random() - 0.5) * SWARM_CLUSTER_SPREAD * 2,
          );
          instructions.push({
            type: pick.type,
            position: position.add(offset),
            statScale: this.statScale,
          });
        }
      } else {
        instructions.push({
          type: pick.type,
          position,
          statScale: this.statScale,
        });
      }
    }

    return instructions;
  }

  getDespawnRadius(screenWidth: number, screenHeight: number): number {
    const spawnRadius = this.getSpawnRadius(screenWidth, screenHeight);
    return spawnRadius * DESPAWN_RADIUS_MULTIPLIER;
  }

  reset(): void {
    this.waveNumber = 1;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.spawnInterval = INITIAL_SPAWN_INTERVAL;
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

  private pickEnemyType(): { type: EnemyType; count: number } {
    const roll = Math.random();
    let threshold = 0;

    if (this.waveNumber >= TANK_INTRODUCTION_WAVE) {
      threshold +=
        (this.waveNumber - TANK_INTRODUCTION_WAVE + 1) * TANK_CHANCE_PER_WAVE;
      if (roll < threshold) return { type: "tank", count: 1 };
    }

    if (this.waveNumber >= SWARM_INTRODUCTION_WAVE) {
      threshold +=
        (this.waveNumber - SWARM_INTRODUCTION_WAVE + 1) * SWARM_CHANCE_PER_WAVE;
      if (roll < threshold) {
        const count =
          SWARM_CLUSTER_MIN +
          Math.floor(
            Math.random() * (SWARM_CLUSTER_MAX - SWARM_CLUSTER_MIN + 1),
          );
        return { type: "swarm", count };
      }
    }

    if (this.waveNumber >= RUNNER_INTRODUCTION_WAVE) {
      threshold +=
        (this.waveNumber - RUNNER_INTRODUCTION_WAVE + 1) *
        RUNNER_CHANCE_PER_WAVE;
      if (roll < threshold) return { type: "runner", count: 1 };
    }

    return { type: "shambler", count: 1 };
  }
}
