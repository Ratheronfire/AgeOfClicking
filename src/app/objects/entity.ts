import { BuildingTileType, Tile } from './tile';
import { Vector } from './vector';
import { tilePixelSize } from '../globals';
import { Tick } from './../services/tick/tick.service';
import { ResourcesService } from '../services/resources/resources.service';
import { EnemyService } from './../services/enemy/enemy.service';
import { MapService } from './../services/map/map.service';

export enum FighterStats {
  Attack = 'ATTACK',
  Defense = 'DEFENSE',
  Range = 'RANGE',
  MovementSpeed = 'MOVEMENTSPEED',
  FireRate = 'FIRERATE',
  MaxHealth = 'MAXHEALTH'
}

export class Entity implements Tick {
  name: string;

  position: Vector;
  spawnPosition: Vector;
  currentTile: Tile;

  tilePath: Tile[];
  pathStep: number;
  pathingDone = false;
  animationSpeed: number;

  health: number;
  maxHealth: number;

  public constructor(name: string, position: Vector, currentTile: Tile, health: number, animationSpeed = 0.003, tilePath: Tile[] = []) {
    this.name = name;

    this.position = position;
    this.spawnPosition = new Vector(position.x, position.y);
    this.currentTile = currentTile;

    this.tilePath = tilePath;
    this.pathStep = 0;
    this.pathingDone = false;

    this.health = health;
    this.maxHealth = health;

    this.animationSpeed = animationSpeed;
  }

  tick(elapsed: number, deltaTime: number) {
  }

  public get x(): number {
    return this.position.x;
  }

  public set x(value: number) {
    this.position.x = value;
  }

  public get y(): number {
    return this.position.y;
  }

  public set y(value: number) {
    this.position.y = value;
  }

  updatePathPosition(deltaTime: number) {
    if (this.tilePath === undefined || this.pathStep >= this.tilePath.length - 1) {
      return;
    }

    let totalDistance = this.animationSpeed * deltaTime;

    while (totalDistance > 0) {
      const stepDistance = Math.min(1, totalDistance);
      totalDistance -= 1;

      const currentTile = this.tilePath[this.pathStep];
      const destinationTile = this.tilePath[this.pathStep + 1];

      this.x += (destinationTile.x - currentTile.x) * stepDistance;
      this.y += (destinationTile.y - currentTile.y) * stepDistance;

      const offset = this.position.subtract(new Vector(currentTile.x, currentTile.y));

      if (Math.abs(offset.x) >= tilePixelSize || Math.abs(offset.y) >= tilePixelSize) {
        this.pathStep++;
        this.currentTile = destinationTile;

        if (this.pathStep === this.tilePath.length - 1) {
            this.pathingDone = true;
            break;
        }
      }
    }
  }
}

export class Actor extends Entity {
  attack: number;
  defense: number;
  attackRange: number;

  public constructor(name: string, position: Vector, currentTile: Tile, health: number,
      animationSpeed = 0.003, attack: number, defense: number, attackRange: number) {
    super(name, position, currentTile, health, animationSpeed);

    this.attack = attack;
    this.defense = defense;
    this.attackRange = attackRange;
  }
}

interface Target {
  tile: Tile;
  accessible: boolean;
  wanderTarget: boolean;
}

export class Enemy extends Actor {
  targetableBuildingTypes: BuildingTileType[];
  targets: Target[];
  targetIndex: number;
  pathAttempt: number;

  resourcesToSteal: number[];
  resourcesHeld: number[];
  totalHeld: number;
  stealMax: number;
  resourceCapacity: number;

  public constructor(name: string, position: Vector, currentTile: Tile,
      health: number, animationSpeed = 0.003, attack: number, defense: number,
      attackRange: number, targetableBuildingTypes: BuildingTileType[], resourcesToSteal: number[],
      stealMax: number, resourceCapacity: number) {
    super(name, position, currentTile, health, animationSpeed, attack, defense, attackRange);

    this.targetableBuildingTypes = targetableBuildingTypes;
    this.targets = [];
    this.targetIndex = 0;
    this.pathAttempt = 0;

    this.resourcesToSteal = resourcesToSteal;
    this.resourcesHeld = [];
    this.totalHeld = 0;
    this.stealMax = stealMax;
    this.resourceCapacity = resourceCapacity;
  }
}

export class Fighter extends Actor {
  description: string;

  targetEnemy: Enemy;
  cost: number;
  moveable: boolean;

  fireMilliseconds: number;
  lastFire = 0;

  statLevels = {};
  statCosts = {};

  resourcesService: ResourcesService;
  enemyService: EnemyService;
  mapService: MapService;

  public constructor(name: string, position: Vector, currentTile: Tile,
      health: number, animationSpeed, attack: number, defense: number,
      attackRange: number, description: string, cost: number, moveable: boolean, fireMilliseconds: number,
      resourcesService: ResourcesService, enemyService: EnemyService, mapService: MapService) {
    super(name, position, currentTile, health, animationSpeed, attack, defense, attackRange);

    this.description = description;

    this.cost = cost;
    this.moveable = moveable;

    this.fireMilliseconds = fireMilliseconds;

    this.statLevels[FighterStats.Attack] = 1;
    this.statLevels[FighterStats.Defense] = 1;
    this.statLevels[FighterStats.FireRate] = 1;
    this.statLevels[FighterStats.MovementSpeed] = 1;
    this.statLevels[FighterStats.Range] = 1;
    this.statLevels[FighterStats.MaxHealth] = 1;

    this.statCosts[FighterStats.Attack] = 1500;
    this.statCosts[FighterStats.Defense] = 1500;
    this.statCosts[FighterStats.FireRate] = 1500;
    this.statCosts[FighterStats.MovementSpeed] = 1500;
    this.statCosts[FighterStats.Range] = 1500;
    this.statCosts[FighterStats.MaxHealth] = 1500;

    this.resourcesService = resourcesService;
    this.enemyService = enemyService;
    this.mapService = mapService;
  }

  tick(elapsed: number, deltaTime: number) {
    if (elapsed - this.lastFire > this.fireMilliseconds) {
      const enemiesInRange = this.enemyService.enemies.filter(
        enemy => Math.abs(Math.sqrt((this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2)) / 16 <= this.attackRange);

      const targetedEnemy = enemiesInRange[Math.floor(Math.random() * enemiesInRange.length)];

      if (targetedEnemy) {
        this.mapService.spawnProjectile(this, targetedEnemy);
      }

      this.lastFire = elapsed;
    }
  }

  public canUpgradeStat(stat: FighterStats): boolean {
    return this.resourcesService.getResource(0).amount >= this.statCosts[stat];
  }

  public getUpgradedStat(stat: FighterStats): number {
    switch (stat) {
      case FighterStats.Attack: {
        return this.attack * 1.2;
      } case FighterStats.Defense: {
        return this.defense * 1.2;
      }  case FighterStats.FireRate: {
        return this.fireMilliseconds / 1.1;
      } case FighterStats.MovementSpeed: {
        return this.animationSpeed * 1.2;
      } case FighterStats.Range: {
        return this.attackRange + 1;
      } case FighterStats.MaxHealth: {
        return Math.floor(this.maxHealth * 1.2);
      }
    }
  }

  public upgradeStat(stat: FighterStats) {
    if (!this.canUpgradeStat(stat)) {
      return;
    }

    this.resourcesService.addResourceAmount(0, -this.statCosts[stat]);

    const upgradedStat = this.getUpgradedStat(stat);
    switch (stat) {
      case FighterStats.Attack: {
        this.attack = upgradedStat;
        break;
      } case FighterStats.Defense: {
        this.defense = upgradedStat;
        break;
      }  case FighterStats.FireRate: {
        this.fireMilliseconds = upgradedStat;
        break;
      } case FighterStats.MovementSpeed: {
        this.animationSpeed = upgradedStat;
        break;
      } case FighterStats.Range: {
        this.attackRange = upgradedStat;
        break;
      } case FighterStats.MaxHealth: {
        this.maxHealth = upgradedStat;
        this.health = this.maxHealth;
      }
    }

    this.statLevels[stat]++;
    this.statCosts[stat] *= 1.5;
  }

  public canHeal(): boolean {
    return this.resourcesService.getResource(0).amount >= this.healCost;
  }

  public heal() {
    if (!this.canHeal()) {
      return;
    }

    this.resourcesService.addResourceAmount(0, -this.healCost);
    this.health = this.maxHealth;
  }

  public get healCost() {
    return (this.cost / this.maxHealth) * 0.65 * (this.maxHealth - this.health);
  }
}

export class Projectile extends Entity {
  owner: Actor;
  target: Actor;

  rotation: number;

  hitTarget = false;

  public constructor(name: string, position: Vector, currentTile: Tile,
      animationSpeed = 0.003, owner: Actor, target: Actor) {
    super(name, position, currentTile, 1, animationSpeed);

    this.owner = owner;
    this.target = target;
  }

  tick(elapsed: number, deltaTime: number) {
    const distance = this.target.position.subtract(this.position);
    const totalDistance = this.target.position.subtract(this.spawnPosition);

    if (distance.magnitude < tilePixelSize) {
      this.target.health -= this.owner.attack;
      this.hitTarget = true;
    }

    const gradientY = this.target.y - this.y;
    const gradientX = this.target.x - this.x;
    const angle = Math.atan2(gradientY, gradientX) + (Math.PI / 2);

    totalDistance.x *= this.animationSpeed * deltaTime;
    totalDistance.y *= this.animationSpeed * deltaTime;

    this.position = this.position.add(totalDistance);
    this.rotation = angle;
  }
}

export class ResourceAnimation extends Entity {
  resourceId: number;
  multiplier: number;

  spawnedByPlayer: boolean;

  public constructor(position: Vector, currentTile: Tile, animationSpeed = 0.003,
      resourceId: number, multiplier: number, spawnedByPlayer: boolean, tilePath: Tile[]) {
    super('', position, currentTile, -1, animationSpeed, tilePath);

    this.resourceId = resourceId;
    this.multiplier = multiplier;
    this.spawnedByPlayer = spawnedByPlayer;
  }

  tick(elapsed: number, deltaTime: number) {
    this.updatePathPosition(deltaTime);
  }
}
