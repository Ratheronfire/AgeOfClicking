import { HealthBar } from '../healthbar';
import { ResourceEnum } from '../resourceData';
import { BuildingTileType, MapTileType } from '../tile/tile';
import { GameService } from './../../game/game.service';
import { EnemyType } from './enemy/enemy';
import { Entity, EntityState } from './entity';
import { Projectile } from './projectile';
import { UnitStat, UnitType } from './unit/unit';

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

  resourcesHeld: Map<ResourceEnum, number>;
  resourceCapacity: number;
  totalHeld = 0;

  actionInterval = 250;
  lastActionTime = 0;

  targetableBuildingTypes: BuildingTileType[];
  targetableActorTypes: ActorData[];
  targets: Phaser.Tilemaps.Tile[] = [];
  selectedTarget: Phaser.Tilemaps.Tile;

  public constructor(x: number, y: number, health: number, animationSpeed: number,
      attack: number, defense: number, attackRange: number,
      scene: Phaser.Scene, texture: string, frame: string | number, game: GameService) {
    super(x, y, health, animationSpeed, scene, texture, frame, game);

    this.attack = attack;
    this.defense = defense;
    this.attackRange = attackRange;

    this.terrainTypeControlsSpeed = true;

    this.healthBar = new HealthBar(this, scene);
  }

  tick(elapsed: number, deltaTime: number) {
    if (!this.currentTileIsValid()) {
      // If the actor spawns on an invalid tile, we'll just move it elsewhere.
      if (!this.moveToNeighbor()) {
        this.moveToNewTile();
      }
    }

    this.lastIslandId = this.islandId;

    this.healthBar.tick(elapsed, deltaTime, this.x, this.y);

    super.tick(elapsed, deltaTime);
  }

  moveAlongPath(deltaTime: number) {
    if (this.isPathBroken()) {
      this.finishTask();

      return;
    }

    super.moveAlongPath(deltaTime);
  }

  findTargets() {
    for (const buildingType of this.targetableBuildingTypes) {
      const matchingTiles = this.game.map.mapLayer.filterTiles(tile => tile.properties['buildingNode'] &&
        tile.properties['buildingNode'].tileType === buildingType);

      for (const tile of matchingTiles) {
        if (!this.targets.includes(tile)) {
          this.targets.push(tile);
        }
      }
    }

    if (this.currentState === EntityState.Wandering) {
      this.currentState = EntityState.MovingToTarget;

      this.pickTarget();
    }
  }

  pickTarget() {
  }

  finishTask() {
    this.targets = this.targets.filter(target => target !== this.selectedTarget);

    if (this.currentState === EntityState.MovingToTarget) {
      this.pickTarget();
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

  protected currentTileIsValid(): boolean {
    return this.currentTile && this.game.map.isTileWalkable(this.currentTile);
  }

  moveToNeighbor(): boolean {
    if (!this.currentTile) {
      return false;
    }

    for (const neighbor of this.game.map.getNeighborTiles(this.currentTile)) {
      if (this.game.map.isTileWalkable(neighbor)) {
        this.currentTile = neighbor;

        return true;
      }
    }

    return false;
  }

  moveToNewTile() {
    this.currentTile = null;
    if (!this.lastIslandId) {
      this.lastIslandId = this.game.map.getRandomIslandId(10, [MapTileType.Grass]);
    }

    while (!this.currentTile) {
      this.currentTile = this.game.map.getRandomTileOnIsland(this.lastIslandId, [MapTileType.Grass], true, false);
    }

    this.x = this.currentTile.getCenterX();
    this.y = this.currentTile.getCenterY();
  }

  isPathBroken(): boolean {
    return !this.selectedTarget || this.selectedTarget.properties['islandId'] !== this.islandId ||
      this.tilePath.some(tile => !this.game.map.isTileWalkable(tile));
  }

  takeDamage(damageSource: Projectile) {
    const damageDealt = damageSource.owner.attack - this.defense;
    this.health -= damageDealt;

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
