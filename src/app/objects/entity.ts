import { ResourceEnum, ResourceType } from './resourceData';
import { BuildingTileType, MapTileType } from './tile';
import { tilePixelSize } from '../globals';
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

export interface FighterData {
  name: string;
  description: string;

  maxHealth: number;
  cost: number;
  attack: number;
  defense: number;

  movable: boolean;
  attackRange: number;
}

export interface EnemyData {
  name: string;
  description: string;

  maxHealth: number;
  attack: number;
  defense: number;

  targetableBuildingTypes: BuildingTileType[];
  resourcesToSteal: ResourceEnum[];
  stealMax: number;
  resourceCapacity: number;

  movable: boolean;
  attackRange: number;
}

export class Entity extends Phaser.GameObjects.PathFollower {
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

export class Enemy extends Actor {
  targetableBuildingTypes: BuildingTileType[];
  targets: Phaser.Tilemaps.Tile[] = [];
  selectedTarget: Phaser.Tilemaps.Tile;
  wanderMode = false;

  pathAttempt = 0;
  maxPathRetryCount = 250;

  resourcesToSteal: ResourceEnum[];
  resourcesHeld: Map<ResourceEnum, number>;
  totalHeld = 0;
  stealMax: number;
  resourceCapacity: number;

  mapService: MapService;

  public constructor(name: string, x: number, y: number, currentTile: Phaser.Tilemaps.Tile,
      health: number, animationSpeed = 0.003, attack: number, defense: number,
      attackRange: number, targetableBuildingTypes: BuildingTileType[], resourcesToSteal: ResourceEnum[],
      stealMax: number, resourceCapacity: number, scene: Phaser.Scene, texture: string, frame: string | number, mapService: MapService) {
    super(name, x, y, currentTile, health, animationSpeed, attack, defense, attackRange, scene, texture, frame);

    this.targetableBuildingTypes = targetableBuildingTypes;

    this.resourcesToSteal = resourcesToSteal;
    this.resourcesHeld = new Map<ResourceEnum, number>();
    this.totalHeld = 0;
    this.stealMax = stealMax;
    this.resourceCapacity = resourceCapacity;

    this.mapService = mapService;

    this.findTargets();
    this.pickTarget();
  }

  findTargets() {
    for (const buildingType of this.targetableBuildingTypes) {
      const matchingTiles = this.mapService.mapLayer.filterTiles(tile => tile.properties['buildingNode'] &&
        tile.properties['buildingNode'].tileType === buildingType);

      for (const tile of matchingTiles) {
        if (!this.targets.includes(tile)) {
          this.targets.push(tile);
        }
      }
    }

    if (this.wanderMode) {
      this.wanderMode = false;

      this.pickTarget();
    }
  }

  pickTarget() {
    if (this.targets.length) {
      const sortedTargets = this.targets.sort((a, b) => {
        const enemyPosition = new Phaser.Math.Vector2(this.x, this.y);
        const aPos = new Phaser.Math.Vector2(a.x, a.y);
        const bPos = new Phaser.Math.Vector2(b.x, b.y);

        return Math.abs(aPos.distance(enemyPosition)) - Math.abs(bPos.distance(enemyPosition));
      });

      this.selectedTarget = sortedTargets[0];
    } else {
      this.wanderMode = true;

      const randomTarget = this.mapService.getRandomTile([MapTileType.Grass]);
      this.targets.push(randomTarget);
      this.selectedTarget = randomTarget;
    }

    this.mapService.findPath(this.currentTile, this.selectedTarget, false, true).subscribe(tilePath => this.beginPathing(tilePath));
  }

  finishTask() {
    this.targets = this.targets.filter(target => target !== this.selectedTarget);

    this.pickTarget();
  }

  beginPathing(tilePath: Phaser.Tilemaps.Tile[]) {
    if (!tilePath.length) {
      this.pathAttempt++;
      this.targets.filter(target => target !== this.selectedTarget);

      if (this.pathAttempt > this.maxPathRetryCount) {
        this.destroy();
      } else {
        this.pickTarget();
      }
    } else {
      this.path = this.mapService.tilesToLinearPath(tilePath);

      this.startFollow((this.path.curves.length - 1) * 1000 / this.animationSpeed);

      this.pathTween.setCallback('onComplete', function(self) { self.finishTask(); }, [this]);
    }
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
