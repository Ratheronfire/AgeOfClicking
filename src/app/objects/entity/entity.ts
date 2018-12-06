import { HealthBar } from '../healthbar';
import { GameService } from './../../game/game.service';

export enum EntityState {
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

export class Entity extends Phaser.GameObjects.Sprite {
  spawnPosition: Phaser.Math.Vector2;
  currentTile: Phaser.Tilemaps.Tile;

  tilePath: Phaser.Tilemaps.Tile[] = [];
  pathAttempt = 0;
  maxPathRetryCount = 25;

  animationSpeed: number;
  animationSpeedFactor = 0.002;
  terrainTypeControlsSpeed = false;

  health: number;
  maxHealth: number;
  healthBar: HealthBar;

  currentState: EntityState;

  protected game: GameService;

  public constructor(x: number, y: number, health: number, animationSpeed: number,
                     scene: Phaser.Scene, texture: string, frame: string | number,
                     game: GameService) {
    super(scene, x, y, texture, frame);

    this.game = game;

    this.name = name;

    this.spawnPosition = new Phaser.Math.Vector2(x, y);
    this.currentTile = this.game.map.mapLayer.getTileAtWorldXY(x, y);

    this.health = health;
    this.maxHealth = health;

    this.animationSpeed = animationSpeed;
  }

  tick(elapsed: number, deltaTime: number) {
    if (this.currentState === EntityState.MovingToTarget || this.currentState === EntityState.Wandering) {
      this.moveAlongPath(deltaTime);
    }

    if (this.currentState === EntityState.Sleeping) {
      this.finishTask();
    }
  }

  beginPathing(tilePath: Phaser.Tilemaps.Tile[]) {
    if (!tilePath.length) {
      this.pathAttempt++;

      if (this.pathAttempt < this.maxPathRetryCount) {
        this.finishTask();
      } else {
        this.currentState = EntityState.Sleeping;
      }
    } else {
      this.tilePath = tilePath;

      if (this.tilePath.length > 1) {
        this.tilePath.splice(0, 1);
      }

      this.currentState = EntityState.MovingToTarget;
    }
  }

  finishTask() {
  }

  moveAlongPath(deltaTime: number) {
    if (!this.tilePath.length) {
      this.finishTask();

      return;
    }

    const totalDistanceX = this.tilePath[0].pixelX - this.currentTile.pixelX;
    const totalDistanceY = this.tilePath[0].pixelY - this.currentTile.pixelY;

    const adjustedSpeed = this.animationSpeed * this.animationSpeedFactor /
      (this.terrainTypeControlsSpeed ? this.game.pathfinding.getTileWeight(this.currentTile) : 1);

    this.x += totalDistanceX * deltaTime * adjustedSpeed;
    this.y += totalDistanceY * deltaTime * adjustedSpeed;

    const center = this.getCenter();

    if (Math.abs(center.x - this.currentTile.getCenterX()) >= Math.abs(totalDistanceX) &&
        Math.abs(center.y - this.currentTile.getCenterY()) >= Math.abs(totalDistanceY)) {
      this.currentTile = this.tilePath.splice(0, 1)[0];
      this.x = this.currentTile.getCenterX();
      this.y = this.currentTile.getCenterY();
    }
  }

  get position(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.x, this.y);
  }
}
