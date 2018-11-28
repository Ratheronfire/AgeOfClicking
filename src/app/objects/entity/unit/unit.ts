import { GameService } from './../../../game/game.service';
import { ResourceEnum } from '../../resourceData';
import { Actor, ActorState, UnitData } from '../actor';
import { Enemy } from '../enemy/enemy';

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
  Builder = 'BUILDER'
}

export class Unit extends Actor {
  unitType: UnitType;

  description: string;

  targetEnemy: Enemy;
  cost: number;
  movable: boolean;

  fireMilliseconds = 1000;
  lastFire = 0;

  stats: UnitStat[];
  statLevels = {};
  statCosts = {};

  public constructor(x: number, y: number, unitData: UnitData,
      scene: Phaser.Scene, texture: string, frame: string | number, game: GameService) {
    super(x, y, unitData.maxHealth, unitData.movementSpeed, unitData.attack, unitData.defense,
      unitData.attackRange, scene, texture, frame, game);

    this.unitType = unitData.unitType;

    this.name = unitData.name;
    this.description = unitData.description;

    this.cost = unitData.cost;
    this.movable = unitData.movable;

    this.stats = unitData.stats;
    for (const stat of unitData.stats) {
      this.statLevels[stat] = 1;
      this.statCosts[stat] = 1500;
    }

    this.findTargets();
    this.pickTarget();
  }

  pickTarget() {
    if (!this.islandId) {
      // The enemy's position has become invalid, so we'll just move it somewhere random.
      this.moveToNewTile();
    }

    this.findTargets();

    if (this.targets.length) {
      const sortedTargets = this.sortedTargets();
      this.selectedTarget = sortedTargets[0];
    } else {
      this.currentState = ActorState.Sleeping;
      this.selectedTarget = null;
    }

    if (this.selectedTarget) {
      this.game.map.findPath(this.currentTile, this.selectedTarget, false, true).subscribe(tilePath => this.beginPathing(tilePath));
    }
  }

  public canUpgradeStat(stat: UnitStat): boolean {
    return this.game.resources.getResource(ResourceEnum.Gold).amount >= this.statCosts[stat];
  }

  public getStatString(stat: UnitStat): string {
    switch (stat) {
      case UnitStat.Attack: {
        return 'Attack: ' + Math.floor(this.attack);
      } case UnitStat.Defense: {
        return 'Defense: ' + Math.floor(this.defense);
      }  case UnitStat.FireRate: {
        return 'Fire Rate:' + Math.floor(this.fireMilliseconds / 100) / 10 + '/Second';
      } case UnitStat.MovementSpeed: {
        return 'Movement Speed: ' + Math.floor(this.animationSpeed);
      } case UnitStat.Range: {
        return 'Attack Range: ' + this.attackRange + (this.attackRange > 1 ? ' Tiles' : ' Tile');
      } case UnitStat.MaxHealth: {
        return 'Max Health: ' + Math.floor(this.maxHealth);
      }
    }
  }

  public getUpgradedStatString(stat: UnitStat): string {
    switch (stat) {
      case UnitStat.Attack: {
        return 'Attack: ' + Math.floor(this.getUpgradedStat(stat));
      } case UnitStat.Defense: {
        return 'Defense: ' + Math.floor(this.getUpgradedStat(stat));
      }  case UnitStat.FireRate: {
        return 'Fire Rate:' + Math.floor(this.getUpgradedStat(stat) / 100) / 10 + '/Second';
      } case UnitStat.MovementSpeed: {
        return 'Movement Speed: ' + Math.floor(this.getUpgradedStat(stat));
      } case UnitStat.Range: {
        return 'Attack Range: ' + this.getUpgradedStat(stat) + ' Tiles';
      } case UnitStat.MaxHealth: {
        return 'Max Health: ' + Math.floor(this.getUpgradedStat(stat));
      }
    }
  }

  public getStat(stat: UnitStat): number {
    const tileString = this.attackRange === 1 ? ' Tile' : ' Tiles';

    switch (stat) {
      case UnitStat.Attack: {
        return this.attack;
      } case UnitStat.Defense: {
        return this.defense;
      }  case UnitStat.FireRate: {
        return this.fireMilliseconds;
      } case UnitStat.MovementSpeed: {
        return this.animationSpeed;
      } case UnitStat.Range: {
        return this.attackRange;
      } case UnitStat.MaxHealth: {
        return Math.floor(this.maxHealth);
      }
    }
  }

  public getUpgradedStat(stat: UnitStat): number {
    switch (stat) {
      case UnitStat.Attack: {
        return this.attack * 1.2;
      } case UnitStat.Defense: {
        return this.defense * 1.2;
      }  case UnitStat.FireRate: {
        return this.fireMilliseconds / 1.1;
      } case UnitStat.MovementSpeed: {
        return this.animationSpeed * 1.2;
      } case UnitStat.Range: {
        return this.attackRange + 1;
      } case UnitStat.MaxHealth: {
        return Math.floor(this.maxHealth * 1.2);
      }
    }
  }

  public upgradeStat(stat: UnitStat) {
    if (!this.canUpgradeStat(stat)) {
      return;
    }

    this.game.resources.getResource(ResourceEnum.Gold).addAmount(-this.statCosts[stat]);

    const upgradedStat = this.getUpgradedStat(stat);
    switch (stat) {
      case UnitStat.Attack: {
        this.attack = upgradedStat;
        break;
      } case UnitStat.Defense: {
        this.defense = upgradedStat;
        break;
      }  case UnitStat.FireRate: {
        this.fireMilliseconds = upgradedStat;
        break;
      } case UnitStat.MovementSpeed: {
        this.animationSpeed = upgradedStat;
        break;
      } case UnitStat.Range: {
        this.attackRange = upgradedStat;
        break;
      } case UnitStat.MaxHealth: {
        this.maxHealth = upgradedStat;
        this.health = this.maxHealth;
      }
    }

    this.statLevels[stat]++;
    this.statCosts[stat] *= 1.5;
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
