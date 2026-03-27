import { Vector2 } from "../utils/vector2";
import { Player } from "../entities/player";
import { Enemy } from "../entities/enemy";

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
