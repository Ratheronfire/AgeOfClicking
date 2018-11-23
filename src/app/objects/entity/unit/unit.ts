import { EnemyService } from 'src/app/services/enemy/enemy.service';
import { MapService } from 'src/app/services/map/map.service';
import { ResourcesService } from 'src/app/services/resources/resources.service';
import { ResourceEnum } from '../../resourceData';
import { BuildingNode } from '../../tile';
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
  repairAmount = 5;

  stats: UnitStat[];
  statLevels = {};
  statCosts = {};

  resourcesService: ResourcesService;
  enemyService: EnemyService;
  mapService: MapService;

  public constructor(x: number, y: number, unitData: UnitData,
      scene: Phaser.Scene, texture: string, frame: string | number,
      resourcesService: ResourcesService, enemyService: EnemyService, mapService: MapService) {
    super(x, y, unitData.maxHealth, unitData.movementSpeed, unitData.attack, unitData.defense,
      unitData.attackRange, mapService, scene, texture, frame);

    this.unitType = unitData.unitType;

    this.description = unitData.description;

    this.cost = unitData.cost;
    this.movable = unitData.movable;

    this.stats = unitData.stats;
    for (const stat of unitData.stats) {
      this.statLevels[stat] = 1;
      this.statCosts[stat] = 1500;
    }

    this.resourcesService = resourcesService;
    this.enemyService = enemyService;

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
      this.mapService.findPath(this.currentTile, this.selectedTarget, false, true).subscribe(tilePath => this.beginPathing(tilePath));
    }
  }

  public canUpgradeStat(stat: UnitStat): boolean {
    return this.resourcesService.resources.get(ResourceEnum.Gold).amount >= this.statCosts[stat];
  }

  public getStatString(stat: UnitStat): string {
    switch (stat) {
      case UnitStat.Attack: {
        return 'Attack: ' + this.attack;
      } case UnitStat.Defense: {
        return 'Defense: ' + this.defense;
      }  case UnitStat.FireRate: {
        return 'Fire Rate:' + Math.floor(this.fireMilliseconds / 100) / 10 + '/Second';
      } case UnitStat.MovementSpeed: {
        return 'Movement Speed: ' + this.animationSpeed;
      } case UnitStat.Range: {
        return 'Attack Range: ' + this.attackRange + (this.attackRange > 1 ? ' Tiles' : ' Tile');
      } case UnitStat.MaxHealth: {
        return 'Max Health: ' + this.maxHealth;
      }
    }
  }

  public getUpgradedStatString(stat: UnitStat): string {
    switch (stat) {
      case UnitStat.Attack: {
        return 'Attack: ' + this.getUpgradedStat(stat);
      } case UnitStat.Defense: {
        return 'Defense: ' + this.getUpgradedStat(stat);
      }  case UnitStat.FireRate: {
        return 'Fire Rate:' + Math.floor(this.getUpgradedStat(stat) / 100) / 10 + '/Second';
      } case UnitStat.MovementSpeed: {
        return 'Movement Speed: ' + this.getUpgradedStat(stat);
      } case UnitStat.Range: {
        return 'Attack Range: ' + this.getUpgradedStat(stat) + ' Tiles';
      } case UnitStat.MaxHealth: {
        return 'Max Health: ' + this.getUpgradedStat(stat);
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

    this.resourcesService.resources.get(ResourceEnum.Gold).addAmount(-this.statCosts[stat]);

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
    return this.resourcesService.resources.get(ResourceEnum.Gold).amount >= this.healCost;
  }

  public heal() {
    if (!this.canHeal()) {
      return;
    }

    this.resourcesService.resources.get(ResourceEnum.Gold).addAmount(-this.healCost);
    this.health = this.maxHealth;
  }

  public get healCost() {
    return (this.cost / this.maxHealth) * 0.65 * (this.maxHealth - this.health);
  }
}
