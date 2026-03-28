import { Player } from "../entities/player";
import { WeaponStats } from "../entities/weapon";

const BASE_XP = 10;
const XP_PER_LEVEL = 10;

export interface UpgradeDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly apply: (player: Player, weaponStats: WeaponStats) => void;
}

export const UPGRADES: UpgradeDefinition[] = [
  {
    id: "damage",
    name: "Damage+",
    description: "+5 damage",
    apply: (_p, w) => {
      w.damage += 5;
    },
  },
  {
    id: "fire_rate",
    name: "Fire Rate+",
    description: "-15% fire delay",
    apply: (_p, w) => {
      w.fireRate *= 0.85;
    },
  },
  {
    id: "pierce",
    name: "Pierce+",
    description: "+1 pierce",
    apply: (_p, w) => {
      w.pierce += 1;
    },
  },
  {
    id: "proj_size",
    name: "Big Shots",
    description: "+2 projectile size",
    apply: (_p, w) => {
      w.projectileRadius += 2;
    },
  },
  {
    id: "speed",
    name: "Speed+",
    description: "+15% move speed",
    apply: (p) => {
      p.speed *= 1.15;
    },
  },
  {
    id: "magnet",
    name: "Magnet+",
    description: "+30% pickup radius",
    apply: (p) => {
      p.pickupRadius *= 1.3;
    },
  },
  {
    id: "max_health",
    name: "Vitality+",
    description: "+25 max HP (heals)",
    apply: (p) => {
      p.maxHealth += 25;
      p.health += 25;
    },
  },
];

export class LevelingSystem {
  level: number = 1;
  currentXp: number = 0;
  pendingUpgradeChoices: UpgradeDefinition[] | null = null;

  get xpToNextLevel(): number {
    return BASE_XP + this.level * XP_PER_LEVEL;
  }

  get xpProgress(): number {
    return Math.min(1, this.currentXp / this.xpToNextLevel);
  }

  addXp(amount: number): boolean {
    this.currentXp += amount;
    if (this.currentXp >= this.xpToNextLevel) {
      this.currentXp -= this.xpToNextLevel;
      this.level++;
      return true;
    }
    return false;
  }

  generateChoices(): UpgradeDefinition[] {
    const shuffled = [...UPGRADES];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i] as UpgradeDefinition;
      shuffled[i] = shuffled[j] as UpgradeDefinition;
      shuffled[j] = temp;
    }
    return shuffled.slice(0, 3);
  }

  applyUpgrade(
    choiceIndex: number,
    player: Player,
    weaponStats: WeaponStats,
  ): void {
    const choices = this.pendingUpgradeChoices;
    if (!choices) return;
    const upgrade = choices[choiceIndex];
    if (!upgrade) return;
    upgrade.apply(player, weaponStats);
    this.pendingUpgradeChoices = null;
  }

  reset(): void {
    this.level = 1;
    this.currentXp = 0;
    this.pendingUpgradeChoices = null;
  }
}
