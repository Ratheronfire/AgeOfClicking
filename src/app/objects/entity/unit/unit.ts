import { ResourceEnum } from '../../resourceData';
import { Actor, UnitData } from '../actor';
import { Enemy } from '../enemy/enemy';
import { EntityState } from '../entity';
import { Stats } from '../stats';
import { GameService } from './../../../game/game.service';

export enum UnitStat {
  Attack = 'ATTACK',
  Defense = 'DEFENSE',
  Range = 'RANGE',
  MovementSpeed = 'MOVEMENTSPEED',
  FireRate = 'FIRERATE',
  MaxHealth = 'MAXHEALTH',
  RepairRate = 'REPAIRRATE'
}

export enum UnitType {
  Sentry = 'SENTRY',
  Builder = 'BUILDER',
  Lumberjack = 'LUMBERJACK',
  MineralMiner = 'MINERALMINER',
  MetalMiner = 'METALMINER',
  Hunter = 'HUNTER'
}

export class UnitStats extends Stats<UnitStat> {
  owner: Unit;

  public constructor (statList: UnitStat[], owner: Unit, game: GameService) {
    super(statList, game);

    this.owner = owner;
  }

  public getStatString(stat: UnitStat): string {
    switch (stat) {
      case UnitStat.Attack: {
        return `Attack: ${Math.floor(this.getStat(stat))}`;
      } case UnitStat.Defense: {
        return `Defense: ${Math.floor(this.getStat(stat))}`;
      }  case UnitStat.FireRate: {
        return `Fire Rate: ${Math.floor(10000 / this.getStat(stat)) / 10}/Second`;
      } case UnitStat.MovementSpeed: {
        return `Movement Speed: ${Math.floor(this.getStat(stat))}`;
      } case UnitStat.Range: {
        return `Attack Range: ${this.getStat(stat)} ${this.getStat(stat) > 1 ? 'Tiles' : 'Tile'}`;
      } case UnitStat.MaxHealth: {
        return `Max Health: ${Math.floor(this.getStat(stat))}`;
      }
    }
  }

  public getUpgradedStatString(stat: UnitStat): string {
    switch (stat) {
      case UnitStat.Attack: {
        return `Attack: ${Math.floor(this.getUpgradedStat(stat))}`;
      } case UnitStat.Defense: {
        return `Defense: ${Math.floor(this.getUpgradedStat(stat))}`;
      }  case UnitStat.FireRate: {
        return `Fire Rate: ${Math.floor(10000 / this.getUpgradedStat(stat)) / 10}/Second`;
      } case UnitStat.MovementSpeed: {
        return `Movement Speed: ${Math.floor(this.getUpgradedStat(stat))}`;
      } case UnitStat.Range: {
        return `Attack Range: ${this.getUpgradedStat(stat)} Tiles`;
      } case UnitStat.MaxHealth: {
        return `Max Health: ${Math.floor(this.getUpgradedStat(stat))}`;
      }
    }
  }

  public getStat(stat: UnitStat): number {
    switch (stat) {
      case UnitStat.Attack: {
        return this.owner.attack;
      } case UnitStat.Defense: {
        return this.owner.defense;
      }  case UnitStat.FireRate: {
        return this.owner.fireMilliseconds;
      } case UnitStat.MovementSpeed: {
        return this.owner.animationSpeed;
      } case UnitStat.Range: {
        return this.owner.attackRange;
      } case UnitStat.MaxHealth: {
        return Math.floor(this.owner.maxHealth);
      }
    }
  }

  public getUpgradedStat(stat: UnitStat): number {
    switch (stat) {
      case UnitStat.Attack: {
        return this.owner.attack * 1.2;
      } case UnitStat.Defense: {
        return this.owner.defense * 1.2;
      }  case UnitStat.FireRate: {
        return this.owner.fireMilliseconds / 1.1;
      } case UnitStat.MovementSpeed: {
        return this.owner.animationSpeed * 1.2;
      } case UnitStat.Range: {
        return this.owner.attackRange + 1;
      } case UnitStat.MaxHealth: {
        return Math.floor(this.owner.maxHealth * 1.2);
      }
    }
  }

  public upgradeStat(stat: UnitStat, upgradeForFree = false) {
    if (!this.canUpgradeStat(stat) && !upgradeForFree) {
      return;
    }

    const upgradedStat = this.getUpgradedStat(stat);
    switch (stat) {
      case UnitStat.Attack: {
        this.owner.attack = upgradedStat;
        break;
      } case UnitStat.Defense: {
        this.owner.defense = upgradedStat;
        break;
      }  case UnitStat.FireRate: {
        this.owner.fireMilliseconds = upgradedStat;
        break;
      } case UnitStat.MovementSpeed: {
        this.owner.animationSpeed = upgradedStat;
        break;
      } case UnitStat.Range: {
        this.owner.attackRange = upgradedStat;
        break;
      } case UnitStat.MaxHealth: {
        this.owner.maxHealth = upgradedStat;
        this.owner.health = this.owner.maxHealth;
      }
    }

    super.upgradeStat(stat, upgradeForFree);
  }
}

export class Unit extends Actor {
  unitType: UnitType;

  description: string;

  targetEnemy: Enemy;
  cost: number;
  movable: boolean;

  fireMilliseconds = 1000;
  lastFire = 0;

  stats: UnitStats;

  public constructor(x: number, y: number, unitData: UnitData,
      scene: Phaser.Scene, texture: string, frame: string | number, game: GameService) {
    super(x, y, unitData.maxHealth, unitData.movementSpeed, unitData.attack, unitData.defense,
      unitData.attackRange, scene, texture, frame, game);

    this.unitType = unitData.unitType;

    this.name = unitData.name;
    this.description = unitData.description;

    this.cost = unitData.cost;
    this.movable = unitData.movable;

    this.stats = new UnitStats(unitData.stats, this, this.game);

    this.findTargets();
    this.pickTarget();
  }

  pickTarget() {
    if (this.islandId === undefined) {
      // The enemy's position has become invalid, so we'll just move it somewhere random.
      this.moveToNewTile();
    }

    this.findTargets();

    if (this.targets.length) {
      const sortedTargets = this.sortedTargets();
      this.selectedTarget = sortedTargets[0];
    } else {
      this.currentState = EntityState.Sleeping;
      this.selectedTarget = null;
    }

    if (this.selectedTarget) {
      this.game.pathfinding.findPath(this.currentTile, this.selectedTarget, false, true).subscribe(tilePath => this.beginPathing(tilePath));
    }
  }

  public destroy() {
    if (this.healthBar) {
      this.healthBar.destroy();
    }

    super.destroy();
  }

  public canHeal(): boolean {
    return this.game.resources.getResource(ResourceEnum.Gold).amount >= this.healCost;
  }

  public heal() {
    if (!this.canHeal()) {
      return;
    }

    this.game.resources.getResource(ResourceEnum.Gold).addAmount(-this.healCost);
    this.health = this.maxHealth;
  }

  public get healCost() {
    return (this.cost / this.maxHealth) * 0.65 * (this.maxHealth - this.health);
  }
}
