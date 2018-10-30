import { ResourceEnum } from './resourceData';
import { BuildingTileType } from './tile';
import { Vector } from './vector';
import { tilePixelSize } from '../globals';
import { Tick } from './../services/tick/tick.service';
import { ResourcesService } from '../services/resources/resources.service';
import { EnemyService } from './../services/enemy/enemy.service';
import { StoreService } from './../services/store/store.service';
import { MapService } from './../services/map/map.service';

export enum FighterStat {
  Attack = 'ATTACK',
  Defense = 'DEFENSE',
  Range = 'RANGE',
  MovementSpeed = 'MOVEMENTSPEED',
  FireRate = 'FIRERATE',
  MaxHealth = 'MAXHEALTH'
}

export enum ResourceAnimationType {
  PlayerSpawned = 'PLAYERSPAWNED',
  WorkerSpawned = 'WORKERSPAWNED',
  Sold = 'SOLD'
}

export class Entity extends Phaser.GameObjects.PathFollower implements Tick {
  name: string;

  spawnPosition: Phaser.Math.Vector2;
  currentTile: Phaser.Tilemaps.Tile;

  tilePath: Phaser.Tilemaps.Tile[];
  animationSpeed: number;

  health: number;
  maxHealth: number;

  public constructor(name: string, x: number, y: number, currentTile: Phaser.Tilemaps.Tile, health: number, animationSpeed = 0.003,
                     scene: Phaser.Scene, texture: string, frame: string | number, path?: Phaser.Curves.Path) {
    super(scene, path, x, y, texture, frame);

    this.name = name;

    this.spawnPosition = new Phaser.Math.Vector2(x, y);
    this.currentTile = currentTile;

    this.health = health;
    this.maxHealth = health;

    this.animationSpeed = animationSpeed;
  }

  tick(elapsed: number, deltaTime: number) { }

  get position(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.x, this.y);
  }
}

export class Actor extends Entity {
  attack: number;
  defense: number;
  attackRange: number;

  public constructor(name: string, x: number, y: number, currentTile: Phaser.Tilemaps.Tile, health: number,
      animationSpeed = 0.003, attack: number, defense: number, attackRange: number,
      scene: Phaser.Scene, texture: string, frame: string | number) {
    super(name, x, y, currentTile, health, animationSpeed, scene, texture, frame);

    this.attack = attack;
    this.defense = defense;
    this.attackRange = attackRange;
  }
}

interface Target {
  tile: Phaser.Tilemaps.Tile;
  accessible: boolean;
  wanderTarget: boolean;
}

export class Enemy extends Actor {
  targetableBuildingTypes: BuildingTileType[];
  targets: Target[];
  targetIndex: number;
  pathAttempt: number;

  resourcesToSteal: ResourceEnum[];
  resourcesHeld: Map<ResourceEnum, number>;
  totalHeld: number;
  stealMax: number;
  resourceCapacity: number;

  public constructor(name: string, x: number, y: number, currentTile: Phaser.Tilemaps.Tile,
      health: number, animationSpeed = 0.003, attack: number, defense: number,
      attackRange: number, targetableBuildingTypes: BuildingTileType[], resourcesToSteal: ResourceEnum[],
      stealMax: number, resourceCapacity: number, scene: Phaser.Scene, texture: string, frame: string | number) {
    super(name, x, y, currentTile, health, animationSpeed, attack, defense, attackRange, scene, texture, frame);

    this.targetableBuildingTypes = targetableBuildingTypes;
    this.targets = [];
    this.targetIndex = 0;
    this.pathAttempt = 0;

    this.resourcesToSteal = resourcesToSteal;
    this.resourcesHeld = new Map<ResourceEnum, number>();
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

  public constructor(name: string, x: number, y: number, currentTile: Phaser.Tilemaps.Tile,
      health: number, animationSpeed, attack: number, defense: number, attackRange: number,
      description: string, cost: number, moveable: boolean, fireMilliseconds: number,
      scene: Phaser.Scene, texture: string, frame: string | number,
      resourcesService: ResourcesService, enemyService: EnemyService, mapService: MapService) {
    super(name, x, y, currentTile, health, animationSpeed, attack, defense, attackRange, scene, texture, frame);

    this.description = description;

    this.cost = cost;
    this.moveable = moveable;

    this.fireMilliseconds = fireMilliseconds;

    this.statLevels[FighterStat.Attack] = 1;
    this.statLevels[FighterStat.Defense] = 1;
    this.statLevels[FighterStat.FireRate] = 1;
    this.statLevels[FighterStat.MovementSpeed] = 1;
    this.statLevels[FighterStat.Range] = 1;
    this.statLevels[FighterStat.MaxHealth] = 1;

    this.statCosts[FighterStat.Attack] = 1500;
    this.statCosts[FighterStat.Defense] = 1500;
    this.statCosts[FighterStat.FireRate] = 1500;
    this.statCosts[FighterStat.MovementSpeed] = 1500;
    this.statCosts[FighterStat.Range] = 1500;
    this.statCosts[FighterStat.MaxHealth] = 1500;

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

  public canUpgradeStat(stat: FighterStat): boolean {
    return this.resourcesService.resources.get(ResourceEnum.Gold).amount >= this.statCosts[stat];
  }

  public getUpgradedStat(stat: FighterStat): number {
    switch (stat) {
      case FighterStat.Attack: {
        return this.attack * 1.2;
      } case FighterStat.Defense: {
        return this.defense * 1.2;
      }  case FighterStat.FireRate: {
        return this.fireMilliseconds / 1.1;
      } case FighterStat.MovementSpeed: {
        return this.animationSpeed * 1.2;
      } case FighterStat.Range: {
        return this.attackRange + 1;
      } case FighterStat.MaxHealth: {
        return Math.floor(this.maxHealth * 1.2);
      }
    }
  }

  public upgradeStat(stat: FighterStat) {
    if (!this.canUpgradeStat(stat)) {
      return;
    }

    this.resourcesService.resources.get(ResourceEnum.Gold).addAmount(-this.statCosts[stat]);

    const upgradedStat = this.getUpgradedStat(stat);
    switch (stat) {
      case FighterStat.Attack: {
        this.attack = upgradedStat;
        break;
      } case FighterStat.Defense: {
        this.defense = upgradedStat;
        break;
      }  case FighterStat.FireRate: {
        this.fireMilliseconds = upgradedStat;
        break;
      } case FighterStat.MovementSpeed: {
        this.animationSpeed = upgradedStat;
        break;
      } case FighterStat.Range: {
        this.attackRange = upgradedStat;
        break;
      } case FighterStat.MaxHealth: {
        this.maxHealth = upgradedStat;
        this.health = this.maxHealth;
      }
    }

    this.statLevels[stat]++;
    this.statCosts[stat] *= 1.5;
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

export class Projectile extends Entity {
  owner: Actor;
  target: Actor;

  rotation: number;

  hitTarget = false;

  timeSinceSpawn = 0;
  lifeSpan = 5000;

  public constructor(name: string, x: number, y: number, currentTile: Phaser.Tilemaps.Tile,
      animationSpeed = 0.003, owner: Actor, target: Actor, scene: Phaser.Scene, texture: string, frame: string | number) {
    super(name, x, y, currentTile, 1, animationSpeed, scene, texture, frame);

    this.owner = owner;
    this.target = target;
  }

  tick(elapsed: number, deltaTime: number) {
    this.timeSinceSpawn += deltaTime;
    if (this.timeSinceSpawn > this.lifeSpan || !this.target || !this.target.health) {
      this.hitTarget = true;
      return;
    }

    const distance = this.target.position.subtract(this.position);
    const totalDistance = this.target.position.subtract(this.spawnPosition);

    if (distance.length() < tilePixelSize) {
      this.target.health -= this.owner.attack;
      this.hitTarget = true;
    }

    const gradientY = this.target.y - this.y;
    const gradientX = this.target.x - this.x;
    const angle = Math.atan2(gradientY, gradientX) + (Math.PI / 2);

    totalDistance.x *= this.animationSpeed * deltaTime;
    totalDistance.y *= this.animationSpeed * deltaTime;

    const newPosition = this.position.add(totalDistance);
    this.x = newPosition.x;
    this.y = newPosition.y;

    this.rotation = angle;
  }
}

export class ResourceAnimation extends Entity {
  animationType: ResourceAnimationType;

  resourceEnum: ResourceEnum;
  multiplier: number;

  spawnedByPlayer: boolean;

  resourcesService: ResourcesService;
  storeService: StoreService;

  public constructor(x: number, y: number, currentTile: Phaser.Tilemaps.Tile, animationSpeed = 0.003,
      path: Phaser.Curves.Path, animationType: ResourceAnimationType, resourceEnum: ResourceEnum,
      multiplier: number, spawnedByPlayer: boolean, scene: Phaser.Scene, texture: string, frame: string | number,
      resourcesService: ResourcesService, storeService: StoreService) {
    super('', x, y, currentTile, -1, animationSpeed, scene, texture, frame, path);

    this.animationType = animationType;

    this.resourceEnum = resourceEnum;
    this.multiplier = multiplier;
    this.spawnedByPlayer = spawnedByPlayer;

    this.resourcesService = resourcesService;
    this.storeService = storeService;

    this.startFollow((path.curves.length - 1) * 1000 / this.animationSpeed);
  }

  finishAnimation() {
    this.resourcesService.resources.get(this.resourceEnum).finishResourceAnimation(this.multiplier, this.animationType);

    this.destroy();
  }

  get pathingDone(): boolean {
    return this.pathTween.progress >= 1;
  }
}
