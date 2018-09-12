import { BuildingTileType, Tile } from './tile';
import { Vector } from './vector';

export class Entity {
  name: string;

  position: Vector;
  spawnPosition: Vector;
  currentTile: Tile;

  tilePath: Tile[];
  pathStep: number;
  pathingDone = false;

  health: number;
  maxHealth: number;

  public constructor(name: string, position: Vector, currentTile: Tile, health: number, tilePath: Tile[] = []) {
    this.name = name;

    this.position = position;
    this.spawnPosition = new Vector(position.x, position.y);
    this.currentTile = currentTile;

    this.tilePath = tilePath;
    this.pathStep = 0;
    this.pathingDone = false;

    this.health = health;
    this.maxHealth = health;
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
}

export class Actor extends Entity {
  attack: number;
  defense: number;
  attackRange: number;

  public constructor(name: string, position: Vector, currentTile: Tile,
      health: number, attack: number, defense: number, attackRange: number) {
    super(name, position, currentTile, health);

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
      health: number, attack: number, defense: number, attackRange: number,
      targetableBuildingTypes: BuildingTileType[], resourcesToSteal: number[],
      stealMax: number, resourceCapacity: number) {
    super(name, position, currentTile, health, attack, defense, attackRange);

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

  public constructor(name: string, position: Vector, currentTile: Tile,
      health: number, attack: number, defense: number, attackRange: number,
      description: string, cost: number, moveable: boolean) {
    super(name, position, currentTile, health, attack, defense, attackRange);

    this.cost = cost;
    this.moveable = moveable;
  }
}

export class Projectile extends Entity {
  owner: Actor;
  target: Actor;

  rotation: number;

  public constructor(name: string, position: Vector, currentTile: Tile,
      owner: Actor, target: Actor) {
    super(name, position, currentTile, 1);

    this.owner = owner;
    this.target = target;
  }
}

export class ResourceAnimation extends Entity {
  resourceId: number;
  multiplier: number;

  spawnedByPlayer: boolean;

  public constructor(position: Vector, currentTile: Tile,
      resourceId: number, multiplier: number, spawnedByPlayer: boolean, tilePath: Tile[]) {
    super('', position, currentTile, -1, tilePath);

    this.resourceId = resourceId;
    this.multiplier = multiplier;
    this.spawnedByPlayer = spawnedByPlayer;
  }
}
