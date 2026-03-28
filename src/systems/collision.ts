import { Vector2 } from "../utils/vector2";
import { Player } from "../entities/player";
import { Enemy } from "../entities/enemy";
import { Projectile } from "../entities/projectile";

export interface ProjectileHitResult {
  position: Vector2;
  damage: number;
  enemyKilled: boolean;
  knockbackDirection: Vector2;
}

export interface PlayerHitResult {
  position: Vector2;
  damage: number;
}

export function circlesOverlap(
  posA: Vector2,
  radiusA: number,
  posB: Vector2,
  radiusB: number,
): boolean {
  const dx = posA.x - posB.x;
  const dy = posA.y - posB.y;
  const distSq = dx * dx + dy * dy;
  const radiiSum = radiusA + radiusB;
  return distSq < radiiSum * radiiSum;
}

export function findNearestEnemy(
  origin: Vector2,
  enemies: Enemy[],
): Enemy | null {
  let nearest: Enemy | null = null;
  let nearestDistSq = Infinity;
  for (const enemy of enemies) {
    if (!enemy.active) continue;
    const dx = origin.x - enemy.position.x;
    const dy = origin.y - enemy.position.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearest = enemy;
    }
  }
  return nearest;
}

export function checkProjectileEnemyCollisions(
  projectiles: readonly Projectile[],
  enemies: Enemy[],
): ProjectileHitResult[] {
  const results: ProjectileHitResult[] = [];
  for (const projectile of projectiles) {
    if (!projectile.active) continue;
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      if (
        circlesOverlap(
          projectile.position,
          projectile.radius,
          enemy.position,
          enemy.radius,
        )
      ) {
        const knockbackDirection = enemy.position
          .subtract(projectile.position)
          .normalize();
        const wasAlive = enemy.health > 0;
        enemy.takeDamage(projectile.damage, knockbackDirection);
        results.push({
          position: enemy.position,
          damage: projectile.damage,
          enemyKilled: wasAlive && enemy.health <= 0,
          knockbackDirection,
        });
        if (projectile.onHitEnemy()) break;
      }
    }
  }
  return results;
}

export function checkPlayerEnemyCollisions(
  player: Player,
  enemies: Enemy[],
): PlayerHitResult | null {
  if (!player.active || player.isInvincible) return null;

  for (const enemy of enemies) {
    if (!enemy.active) continue;

    if (
      circlesOverlap(
        player.position,
        player.radius,
        enemy.position,
        enemy.radius,
      )
    ) {
      player.takeDamage(enemy.config.damage);
      return {
        position: player.position,
        damage: enemy.config.damage,
      };
    }
  }
  return null;
}
