import { Vector2 } from "../utils/vector2";
import { Player } from "../entities/player";
import { Enemy } from "../entities/enemy";
import { Projectile } from "../entities/projectile";

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
): void {
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
        enemy.takeDamage(projectile.damage);
        if (projectile.onHitEnemy()) break;
      }
    }
  }
}

export function checkPlayerEnemyCollisions(
  player: Player,
  enemies: Enemy[],
): void {
  if (!player.active || player.isInvincible) return;

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
      return; // Only one hit per frame (i-frames kick in)
    }
  }
}
