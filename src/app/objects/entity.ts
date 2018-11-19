import { HealthBar } from './healthbar';
import { ResourceEnum } from './resourceData';
import { BuildingTileType, MapTileType, BuildingNode } from './tile';
import { MessageSource } from './message';
import { ResourcesService } from '../services/resources/resources.service';
import { EnemyService } from './../services/enemy/enemy.service';
import { StoreService } from './../services/store/store.service';
import { MapService } from './../services/map/map.service';
import { MessagesService } from './../services/messages/messages.service';

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

export enum EnemyState {
  /** The enemy is moving towards a specific target. */
  MovingToTarget = 'MOVINGTOTARGET',
  /** The enemy has no targets, and is moving randomly. */
  Wandering = 'WANDERING',
  /** The enemy is looting resources from the player's home base. */
  Looting = 'LOOTING',
  /** The enemy is destroying a building. */
  Destroying = 'DESTROYING',
  /** The enemy is fighting a player-spawned fighter. */
  Fighting = 'FIGHTING',
  /** The enemy is inactive. */
  Sleeping = 'SLEEPING'
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
  healthBar: HealthBar;

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
  currentState: EnemyState = EnemyState.MovingToTarget;

  pathAttempt = 0;
  maxPathRetryCount = 25;
  tilePath: Phaser.Tilemaps.Tile[] = [];

  resourcesToSteal: ResourceEnum[];
  resourcesHeld: Map<ResourceEnum, number>;
  totalHeld = 0;

  actionInterval = 250;
  lastActionTime = 0;

  minimumResourceAmount = 500;
  stealMax: number;
  resourceCapacity: number;

  lastIslandId: number;

  mapService: MapService;
  resourcesService: ResourcesService;
  messagesService: MessagesService;

  public constructor(name: string, x: number, y: number, currentTile: Phaser.Tilemaps.Tile,
      health: number, animationSpeed = 0.003, attack: number, defense: number,
      attackRange: number, targetableBuildingTypes: BuildingTileType[], resourcesToSteal: ResourceEnum[],
      stealMax: number, resourceCapacity: number, scene: Phaser.Scene, texture: string, frame: string | number,
      mapService: MapService, resourcesService: ResourcesService, messagesService: MessagesService) {
    super(name, x, y, currentTile, health, animationSpeed, attack, defense, attackRange, scene, texture, frame);

    this.targetableBuildingTypes = targetableBuildingTypes;

    this.resourcesToSteal = resourcesToSteal;
    this.resourcesHeld = new Map<ResourceEnum, number>();
    this.totalHeld = 0;
    this.stealMax = stealMax;
    this.resourceCapacity = resourceCapacity;

    this.mapService = mapService;
    this.resourcesService = resourcesService;
    this.messagesService = messagesService;

    this.currentTile = this.mapService.mapLayer.getTileAtWorldXY(this.x, this.y);
    this.lastIslandId = this.currentTile.properties['islandId'];

    this.findTargets();
    this.pickTarget();

    this.healthBar = new HealthBar(this, scene);

    this.log('An enemy has appeared!');
  }

  tick(elapsed: number, deltaTime: number) {
    this.lastIslandId = this.islandId;

    this.currentTile = this.mapService.mapLayer.getTileAtWorldXY(this.x, this.y);

    switch (this.currentState) {
      case EnemyState.Looting: {
        if (elapsed - this.lastActionTime > this.actionInterval) {
          this.lastActionTime = elapsed;

          if (this.totalHeld >= this.resourceCapacity ||
              !this.resourcesToSteal.some(resource => this.resourcesService.resources.get(resource).amount > this.minimumResourceAmount)) {
            this.finishTask();

            break;
          }

          const resourceIndex = Math.floor(Math.random() * this.resourcesToSteal.length);
          const resourceToSteal = this.resourcesService.resources.get(this.resourcesToSteal[resourceIndex]);

          if (resourceToSteal.amount > this.minimumResourceAmount) {
            let amountToSteal = Math.floor(Math.random() * this.stealMax);
            if (resourceToSteal.amount - amountToSteal < this.minimumResourceAmount) {
              amountToSteal = resourceToSteal.amount - this.minimumResourceAmount;
            }

            if (!this.resourcesHeld.get(resourceToSteal.resourceEnum)) {
              this.resourcesHeld.set(resourceToSteal.resourceEnum, amountToSteal);
            } else {
              this.resourcesHeld.set(resourceToSteal.resourceEnum, this.resourcesHeld.get(resourceToSteal.resourceEnum) + amountToSteal);
            }

            if (amountToSteal > 0) {
              this.totalHeld += amountToSteal;

              resourceToSteal.addAmount(-amountToSteal);
              this.log(`An enemy stole ${Math.floor(amountToSteal)} ${resourceToSteal.name}!`);
            }
          }
        }

        break;
      } case EnemyState.Destroying: {
        if (elapsed - this.lastActionTime > this.actionInterval) {
          this.lastActionTime = elapsed;

          const buildingNode: BuildingNode = this.currentTile.properties['buildingNode'];

          if (!buildingNode) {
            this.finishTask();
            break;
          }

          buildingNode.takeDamage(this.attack);

          if (buildingNode.health <= 0) {
            this.mapService.updatePaths(this.currentTile, true);
            this.finishTask();
          }
        }

        break;
      } case EnemyState.Wandering:
        case EnemyState.MovingToTarget: {
        if (!this.selectedTarget || this.selectedTarget.properties['islandId'] !== this.islandId ||
            this.tilePath.some(tile => !this.mapService.isTileWalkable(tile))) {
          this.finishTask();
        }

        break;
      }
    }

    this.healthBar.tick(elapsed, deltaTime, this.x, this.y);
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

    if (this.currentState === EnemyState.Wandering) {
      this.currentState = EnemyState.MovingToTarget;

      this.pickTarget();
    }
  }

  pickTarget() {
    if (!this.islandId) {
      // The enemy's position has become invalid, so we'll just move it somewhere random.
      while (!this.currentTile || !this.islandId) {
        const newIslandId = this.mapService.getRandomIslandId();
        this.currentTile = this.mapService.getRandomTileOnIsland(newIslandId, [MapTileType.Grass], true, false);
      }

      this.x = this.currentTile.getCenterX();
      this.y = this.currentTile.getCenterY();
    }

    if (this.targets.length) {
      const sortedTargets = this.targets.sort((a, b) => {
        const enemyPosition = new Phaser.Math.Vector2(this.x, this.y);
        const aPos = new Phaser.Math.Vector2(a.x, a.y);
        const bPos = new Phaser.Math.Vector2(b.x, b.y);

        return Math.abs(aPos.distance(enemyPosition)) - Math.abs(bPos.distance(enemyPosition));
      });

      this.selectedTarget = sortedTargets[0];
    } else {
      const shouldTargetBuilding = Math.random() < 0.15 && this.mapService.islandHasActiveTiles(this.islandId);

      let randomTarget;

      if (shouldTargetBuilding) {
        this.currentState = EnemyState.MovingToTarget;
        randomTarget = this.mapService.getRandomTileOnIsland(this.islandId, [MapTileType.Grass], true, true);
      } else {
        this.currentState = EnemyState.Wandering;
        randomTarget = this.mapService.getRandomTileOnIsland(this.islandId, [MapTileType.Grass, MapTileType.Water], true);
      }

      this.targets.push(randomTarget);
      this.selectedTarget = randomTarget;
    }

    if (!this.selectedTarget) {
      this.currentState = EnemyState.Sleeping;
    } else {
      this.mapService.findPath(this.currentTile, this.selectedTarget, false, true).subscribe(tilePath => this.beginPathing(tilePath));
    }
  }

  finishTask() {
    this.targets = this.targets.filter(target => target !== this.selectedTarget);

    const buildingNode: BuildingNode = this.currentTile.properties['buildingNode'];
    if (!buildingNode) {
      this.currentState = EnemyState.MovingToTarget;
    } else if (buildingNode.tileType === BuildingTileType.Home) {
      this.currentState = this.currentState === EnemyState.Looting ? EnemyState.MovingToTarget : EnemyState.Looting;
    } else {
      this.currentState = this.currentState === EnemyState.Destroying ? EnemyState.MovingToTarget : EnemyState.Destroying;
    }

    if (this.currentState === EnemyState.MovingToTarget) {
      this.pickTarget();
    }
  }

  beginPathing(tilePath: Phaser.Tilemaps.Tile[]) {
    if (!tilePath.length) {
      this.pathAttempt++;

      if (this.pathAttempt < this.maxPathRetryCount) {
        this.finishTask();
      } else {
        this.currentState = EnemyState.Sleeping;
      }
    } else {
      this.tilePath = tilePath;
      this.path = this.mapService.tilesToLinearPath(tilePath);

      this.startFollow((this.path.curves.length - 1) * 1000 / this.animationSpeed);

      this.pathTween.setCallback('onComplete', function(self) { self.finishTask(); }, [this]);
    }
  }

  takeDamage(damageSource: Projectile) {
    this.health -= damageSource.owner.attack;

    this.healthBar.updateHealthbar(this.health / this.maxHealth);

    if (this.health <= 0) {
      this.healthBar.destroy();
      this.kill();
    }
  }

  kill() {
    let enemyDefeatedMessage = 'An enemy has been defeated!';

    if (this.totalHeld > 0) {
      enemyDefeatedMessage += ' Resources recovered:';

      for (const resourceEnum of this.resourcesToSteal) {
        const stolenAmount = this.resourcesHeld.get(resourceEnum);
        if (isNaN(stolenAmount) || stolenAmount <= 0) {
          continue;
        }

        const resource = this.resourcesService.resources.get(resourceEnum);
        resource.addAmount(stolenAmount);

        enemyDefeatedMessage += ` ${Math.floor(stolenAmount)} ${resource.name},`;
      }

      enemyDefeatedMessage = enemyDefeatedMessage.slice(0, enemyDefeatedMessage.length - 1) + '.';
    }

    this.log(enemyDefeatedMessage);

    this.stopFollow();
    this.scene.tweens.killTweensOf(this);
    this.destroy();
  }

  get islandId(): number {
    if (this.currentTile && this.currentTile.properties['islandId'] !== undefined) {
      return this.currentTile.properties['islandId'];
    } else {
      return this.lastIslandId;
    }
  }

  private log(message: string) {
    this.messagesService.add(MessageSource.Enemy, message);
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
        enemy => Math.abs(Math.sqrt((this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2)) / 48 <= this.attackRange);

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

  public takeDamage(amount: number) {
    this.health -= amount;

    if (this.health <= 0) {
      this.health = 0;
      this.kill();
    }
  }

  public kill() {
    if (this.healthBar) {
      this.healthBar.destroy();
    }

    this.stopFollow();
    this.scene.tweens.killTweensOf(this);
    this.destroy();
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
    if (this.timeSinceSpawn > this.lifeSpan || !this.target || !this.target.active || !this.target.health) {
      this.destroy();
    }
  }

  fireProjectile() {
    const gradientY = this.target.y - this.y;
    const gradientX = this.target.x - this.x;
    const angleToTarget = Math.atan2(gradientY, gradientX) + (Math.PI / 2);

    const physicsBody = this.body as Phaser.Physics.Matter.Sprite;
    this.angle = Phaser.Math.RAD_TO_DEG * angleToTarget;
    physicsBody.setVelocity(gradientX * this.animationSpeed, gradientY * this.animationSpeed);
  }
}

export class ResourceAnimation extends Entity {
  animationType: ResourceAnimationType;

  resourceEnum: ResourceEnum;
  multiplier: number;

  spawnedByPlayer: boolean;

  resourcesService: ResourcesService;
  storeService: StoreService;

  public constructor(x: number, y: number, currentTile: Phaser.Tilemaps.Tile, animationSpeed,
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

    this.stopFollow();
    this.scene.tweens.killTweensOf(this);
    this.destroy();
  }

  get pathingDone(): boolean {
    return this.pathTween.progress >= 1;
  }
}
