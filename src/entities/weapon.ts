export interface WeaponStats {
  fireRate: number;
  damage: number;
  projectileSpeed: number;
  projectileRadius: number;
  pierce: number;
  range: number;
}

export const DEFAULT_WEAPON_STATS: WeaponStats = {
  fireRate: 0.4,
  damage: 10,
  projectileSpeed: 400,
  projectileRadius: 4,
  pierce: 1,
  range: 500,
};

export class Weapon {
  stats: WeaponStats;
  private fireTimer: number = 0;

  constructor(stats: WeaponStats = { ...DEFAULT_WEAPON_STATS }) {
    this.stats = stats;
  }

  update(dt: number): void {
    if (this.fireTimer > 0) {
      this.fireTimer -= dt;
    }
  }

  canFire(): boolean {
    return this.fireTimer <= 0;
  }

  resetFireTimer(): void {
    this.fireTimer = this.stats.fireRate;
  }

  reset(): void {
    this.stats = { ...DEFAULT_WEAPON_STATS };
    this.fireTimer = 0;
  }
}
