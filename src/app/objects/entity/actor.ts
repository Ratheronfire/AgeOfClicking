import { MapService } from 'src/app/services/map/map.service';
import { HealthBar } from '../healthbar';
import { ResourceEnum } from '../resourceData';
import { BuildingTileType, MapTileType } from '../tile';
import { EnemyType } from './enemy/enemy';
import { Entity } from './entity';
import { UnitStat, UnitType } from './unit/unit';
import { Projectile } from './projectile';

export enum ActorState {
  /** The actor is moving towards a specific target. */
  MovingToTarget = 'MOVINGTOTARGET',
  /** The actor has no targets, and is moving randomly. */
  Wandering = 'WANDERING',
  /** The actor is fighting another actor. */
  Fighting = 'FIGHTING',
  /** For enemies: The actor is looting resources from the player's home base. */
  Looting = 'LOOTING',
  /** For enemies: The actor is destroying a building. */
  Destroying = 'DESTROYING',
  /** For player units: The actor is defending from a stationary position. */
  Stationary = 'STATIONARY',
  /** For player units: The actor is reparing a building. */
  Repairing = 'REPAIRING',
  /** The actor is inactive. */
  Sleeping = 'SLEEPING'
}

export interface ActorData {
  name: string;
  description: string;

  maxHealth: number;
  attack: number;
  defense: number;

  targetableBuildingTypes: BuildingTileType[];
  targetableActorTypes: ActorData[];

  movementSpeed: number;
  movable: boolean;
  attackRange: number;
}

export interface EnemyData extends ActorData {
  enemyType: EnemyType;
  resourcesToSteal: ResourceEnum[];
  stealMax: number;
  resourceCapacity: number;
}

export interface UnitData extends ActorData {
  unitType: UnitType;
  cost: number;
  stats: UnitStat[];
}

export class Actor extends Entity {
  attack: number;
  defense: number;
  attackRange: number;

  lastIslandId: number;

  actionInterval = 250;
  lastActionTime = 0;

  targetableBuildingTypes: BuildingTileType[];
  targetableActorTypes: ActorData[];
  targets: Phaser.Tilemaps.Tile[] = [];
  selectedTarget: Phaser.Tilemaps.Tile;

  pathAttempt = 0;
  maxPathRetryCount = 25;
  animationSpeedFactor = 0.002;

  currentState: ActorState;

  mapService: MapService;

  public constructor(x: number, y: number, health: number, animationSpeed: number,
      attack: number, defense: number, attackRange: number, mapService: MapService,
      scene: Phaser.Scene, texture: string, frame: string | number) {
    super(x, y, health, animationSpeed, scene, texture, frame, mapService);

    this.attack = attack;
    this.defense = defense;
    this.attackRange = attackRange;

    this.healthBar = new HealthBar(this, scene);
  }

  tick(elapsed: number, deltaTime: number) {
    if (!this.currentTile || !this.mapService.isTileWalkable(this.currentTile)) {
      // If the enemy spawns on an invalid tile, we'll just move it elsewhere.
      if (!this.moveToNeighbor()) {
        this.moveToNewTile();
      }
    }

    this.lastIslandId = this.islandId;

    if (this.currentState === ActorState.MovingToTarget || this.currentState === ActorState.Wandering) {
      this.moveAlongPath(deltaTime);
    }

    if (this.currentState === ActorState.Sleeping) {
      this.finishTask();
    }

    this.healthBar.tick(elapsed, deltaTime, this.x, this.y);
  }

  moveAlongPath(deltaTime: number) {
    if (this.isPathBroken() || !this.tilePath.length) {
      this.finishTask();

      return;
    }

    const totalDistanceX = this.tilePath[0].pixelX - this.currentTile.pixelX;
    const totalDistanceY = this.tilePath[0].pixelY - this.currentTile.pixelY;

    this.x += totalDistanceX * deltaTime * this.animationSpeed * this.animationSpeedFactor;
    this.y += totalDistanceY * deltaTime * this.animationSpeed * this.animationSpeedFactor;

    const center = this.getCenter();

    if (Math.abs(center.x - this.currentTile.getCenterX()) >= Math.abs(totalDistanceX) &&
        Math.abs(center.y - this.currentTile.getCenterY()) >= Math.abs(totalDistanceY)) {
          this.currentTile = this.tilePath.splice(0, 1)[0];
          this.x = this.currentTile.getCenterX();
          this.y = this.currentTile.getCenterY();
        }
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

    if (this.currentState === ActorState.Wandering) {
      this.currentState = ActorState.MovingToTarget;

      this.pickTarget();
    }
  }

  pickTarget() {
  }

  finishTask() {
    this.targets = this.targets.filter(target => target !== this.selectedTarget);

    if (this.currentState === ActorState.MovingToTarget) {
      this.pickTarget();
    }
  }

  beginPathing(tilePath: Phaser.Tilemaps.Tile[]) {
    if (!tilePath.length) {
      this.pathAttempt++;

      if (this.pathAttempt < this.maxPathRetryCount) {
        this.finishTask();
      } else {
        this.currentState = ActorState.Sleeping;
      }
    } else {
      this.tilePath = tilePath;

      if (this.tilePath.length > 1) {
        this.tilePath.splice(0, 1);
      }

      this.path = this.mapService.tilesToLinearPath(tilePath);

      this.currentState = ActorState.MovingToTarget;
    }
  }

  sortedTargets(): Phaser.Tilemaps.Tile[] {
    return this.targets.sort((a, b) => {
      const enemyPosition = new Phaser.Math.Vector2(this.x, this.y);
      const aPos = new Phaser.Math.Vector2(a.pixelX, a.pixelY);
      const bPos = new Phaser.Math.Vector2(b.pixelX, b.pixelY);

      return Math.abs(aPos.distance(enemyPosition)) - Math.abs(bPos.distance(enemyPosition));
    });
  }

  moveToNeighbor(): boolean {
    if (!this.currentTile) {
      return false;
    }

    for (const neighbor of this.mapService.getNeighborTiles(this.currentTile)) {
      if (this.mapService.isTileWalkable(neighbor)) {
        this.currentTile = neighbor;

        return true;
      }
    }

    return false;
  }

  moveToNewTile() {
    this.currentTile = null;
    if (!this.lastIslandId) {
      this.lastIslandId = this.mapService.getRandomIslandId(10);
    }

    while (!this.currentTile) {
      this.currentTile = this.mapService.getRandomTileOnIsland(this.lastIslandId, [MapTileType.Grass], true, false);
    }

    this.x = this.currentTile.getCenterX();
    this.y = this.currentTile.getCenterY();

    if (this.path) {
      this.path.destroy();
      this.stopFollow();
    }
  }

  isPathBroken(): boolean {
    return !this.selectedTarget || this.selectedTarget.properties['islandId'] !== this.islandId ||
      this.tilePath.some(tile => !this.mapService.isTileWalkable(tile));
  }

  takeDamage(damageSource: Projectile) {
    this.health -= damageSource.owner.attack;

    this.healthBar.updateHealthbar(this.health / this.maxHealth);

    if (this.health <= 0) {
      this.healthBar.destroy();
      this.destroy();
    }
  }

  get islandId(): number {
    if (this.currentTile && this.currentTile.properties['islandId'] !== undefined) {
      return this.currentTile.properties['islandId'];
    } else {
      return this.lastIslandId;
    }
  }
}
