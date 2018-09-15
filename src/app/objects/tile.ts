import { Vector } from './vector';

export enum MapTileType {
  Grass = 'GRASS',
  Water = 'WATER',
  Mountain = 'MOUNTAIN'
}

export enum ResourceTileType {
  OakTree = 'OAKTREE',
  PineTree = 'PINETREE',
  BirchTree = 'BIRCHTREE',
  EucalyptusTree = 'EUCALYPTUSTREE',
  WillowTree = 'WILLOWTREE',
  TeakTree = 'TEAKTREE',
  DeadEnt = 'DEADENT',
  StoneMine = 'STONEMINE',
  GraphiteMine = 'GRAPHITEMINE',
  LimestoneMine = 'LIMESTONEMINE',
  MarbleMine = 'MARBLEMINE',
  QuartzMine = 'QUARTZMINE',
  ObsidianMine = 'OBSIDIANMINE',
  DiamondMine = 'DIAMONDMINE',
  CopperMine = 'COPPERMINE',
  TinMine = 'TINMINE',
  IronMine = 'IRONMINE',
  GoldMine = 'GOLDMINE',
  LatinumMine = 'LATINUMMINE',
  UnbelieviumMine = 'UNBELIEVIUMMINE',
  LustrialMine = 'LUSTRIALMINE',
  SpectrusMine = 'SPECTRUSMINE',
  CrackedForge = 'CRACKEDFORGE',
  StoneForge = 'STONEFORGE',
  IronForge = 'IRONFORGE',
  GoldForge = 'GOLDFORGE',
  LatinumForge = 'LATINUMFORGE',
  TemprousDistillery = 'TEMPROUSDISTILLERY'
}

export enum BuildingTileType {
  Wall = 'WALL',
  Road = 'ROAD',
  Home = 'HOME',
  Bridge = 'BRIDGE',
  CrackedForge = 'CRACKEDFORGE',
  StoneForge = 'STONEFORGE',
  IronForge = 'IRONFORGE',
  GoldForge = 'GOLDFORGE',
  LatinumForge = 'LATINUMFORGE',
  TemprousDistillery = 'TEMPROUSDISTILLERY',
  EnemyPortal = 'ENEMYPORTAL'
}

export interface ResourceCost {
  resourceId: number;
  resourceCost: number;
}

export interface MapTile {
  tileType: MapTileType;

  name: string;

  walkable: boolean;
}

export interface BuildingTile {
  tileType: BuildingTileType;

  name: string;
  description: string;
  placeable: boolean;

  upgradeBuilding?: BuildingTileType;

  baseHealth: number;
  repairResource?: number;
  repairCostPerPoint?: number;

  resourceCosts: ResourceCost[];
  buildableSurfaces: MapTileType[];

  placesResourceTile: boolean;
  resourceTileType?: ResourceTileType;

  resourcePathable: boolean;
}

export interface ResourceTile {
  tileType: ResourceTileType;

  name: string;
  placeable: boolean;

  resourceIds: number[];
}

export interface TileCropDetail {
  x: number;
  y: number;

  width: number;
  height: number;
}

export class Tile {
  id: number;

  mapTileType: MapTileType;
  resourceTileType?: ResourceTileType;
  buildingTileType?: BuildingTileType;

  buildingPath?: Tile[];
  buildingRemovable: boolean;

  health: number;
  maxHealth: number;

  position: Vector;

  tileCropDetail: TileCropDetail;

  public constructor(id: number, mapTileType: MapTileType, resourceTileType: ResourceTileType, buildingTileType: BuildingTileType,
        buildingRemovable: boolean, position: Vector, tileCropDetail: TileCropDetail, health: number = -1) {
    this.id = id;

    this.mapTileType = mapTileType;
    this.resourceTileType = resourceTileType;
    this.buildingTileType = buildingTileType;

    this.buildingPath = [];
    this.buildingRemovable = buildingRemovable;

    this.health = health;
    this.maxHealth = health;
    this.position = position;
    this.tileCropDetail = tileCropDetail;
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
