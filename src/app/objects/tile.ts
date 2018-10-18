import { Vector } from './vector';
import { Resource } from './resource';
import { ResourceType, ResourceEnum } from './resourceData';
import { ResourceCost } from './resourceCost';
import { ResourcesService } from '../services/resources/resources.service';
import { MapService } from '../services/map/map.service';

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
  TemprousDistillery = 'TEMPROUSDISTILLERY',
  WheatFarm = 'WHEATFARM',
  RawPotatoFarm = 'RAWPOTATOFARM',
  RiceFarm = 'RICEFARM',
  FishingSpot = 'FISHINGSPOT',
  OakOven = 'OAKOVEN',
  StoneOven = 'STONEOVEN',
  MarbleOven = 'MARBLEOVEN',
  TemprousOven = 'TEMPROUSOVEN',
  ChickenFarm = 'CHICKENFARM',
  CowFarm = 'COWFARM',
  DragonFarm = 'DRAGONFARM'
}

export enum BuildingTileType {
  Wall = 'WALL',
  Road = 'ROAD',
  Home = 'HOME',
  Bridge = 'BRIDGE',
  Tunnel = 'TUNNEL',
  CrackedForge = 'CRACKEDFORGE',
  StoneForge = 'STONEFORGE',
  IronForge = 'IRONFORGE',
  GoldForge = 'GOLDFORGE',
  LatinumForge = 'LATINUMFORGE',
  TemprousDistillery = 'TEMPROUSDISTILLERY',
  EnemyPortal = 'ENEMYPORTAL',
  WoodMarket = 'WOODMARKET',
  MineralMarket = 'MINERALMARKET',
  MetalMarket = 'METALMARKET',
  OakOven = 'OAKOVEN',
  StoneOven = 'STONEOVEN',
  MarbleOven = 'MARBLEOVEN',
  TemprousOven = 'TEMPROUSOVEN',
  ChickenFarm = 'CHICKENFARM',
  CowFarm = 'COWFARM',
  DragonFarm = 'DRAGONFARM'
}

export enum BuildingSubType {
  Resource = 'RESOURCE',
  Market = 'MARKET',
  Misc = 'MISC'
}

export enum TileStat {
  SellRate = 'SELLRATE',
  SellAmount = 'SELLAMOUNT',
  MaxHealth = 'MAXHEALTH'
}

export interface MapTile {
  tileType: MapTileType;

  name: string;

  walkable: boolean;
}

export interface BuildingTile {
  tileType: BuildingTileType;
  subType: BuildingSubType;

  name: string;
  description: string;
  placeable: boolean;
  maxPlaceable: number;

  upgradeBuilding?: BuildingTileType;

  baseHealth: number;
  repairResourceEnum?: ResourceEnum;
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

  spawnsOn: MapTileType[];
  isNaturalResource: boolean;
  spawnRate: number;

  resourceEnums: ResourceEnum[];
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

  market?: Market;

  statLevels = {};
  statCosts = {};

  health: number;
  maxHealth: number;

  position: Vector;

  noiseValue: number;

  tileCropDetail: TileCropDetail;

  resourcesService: ResourcesService;

  public constructor(id: number, mapTileType: MapTileType, resourceTileType: ResourceTileType, buildingTileType: BuildingTileType,
        buildingRemovable: boolean, position: Vector, tileCropDetail: TileCropDetail,
        health: number = -1, noiseValue: number, resourcesService: ResourcesService) {
    this.id = id;

    this.mapTileType = mapTileType;
    this.resourceTileType = resourceTileType;
    this.buildingTileType = buildingTileType;

    this.buildingPath = [];
    this.buildingRemovable = buildingRemovable;

    this.statLevels[TileStat.MaxHealth] = 1;
    this.statCosts[TileStat.MaxHealth] = 1500;

    this.health = health;
    this.maxHealth = health;
    this.position = position;

    this.noiseValue = noiseValue;

    this.tileCropDetail = tileCropDetail;

    this.resourcesService = resourcesService;
  }

  public canUpgradeStat(stat: TileStat): boolean {
    return this.resourcesService.resources.get(ResourceEnum.Gold).amount >= this.statCosts[stat];
  }

  public getUpgradedStat(stat: TileStat): number {
    switch (stat) {
      case TileStat.SellAmount: {
        return this.market.sellQuantity * 1.2;
      } case TileStat.SellRate: {
        return this.market.sellInterval / 1.1;
      } case TileStat.MaxHealth: {
        return Math.floor(this.maxHealth * 1.2);
      }
    }
  }

  public upgradeStat(stat: TileStat) {
    if (!this.canUpgradeStat(stat)) {
      return;
    }

    this.resourcesService.resources.get(ResourceEnum.Gold).addAmount(-this.statCosts[stat]);

    const upgradedStat = this.getUpgradedStat(stat);
    switch (stat) {
      case TileStat.SellAmount: {
        this.market.sellQuantity = upgradedStat;
        break;
      } case TileStat.SellRate: {
        this.market.sellInterval = upgradedStat;
        break;
      } case TileStat.MaxHealth: {
        this.maxHealth = upgradedStat;
        this.health = this.maxHealth;
        break;
      }
    }

    this.statLevels[stat]++;
    this.statCosts[stat] *= 1.5;
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

export class Market {
  mapService: MapService;
  resourcesService: ResourcesService;

  homeTile: Tile;
  owningTile: Tile;
  tilePath: Tile[];
  soldResources: Resource[];
  currentResource = 0;

  recentSales: number[] = [];
  recentWindowSize = 20;
  timeSinceLastSale = 0;

  lastSellTime = 0;
  sellInterval = 1000;
  sellQuantity = 50;

  public constructor(mapService: MapService, resourcesService: ResourcesService, resourceType: ResourceType, owningTile: Tile,
      shouldInitStats: boolean) {
    if (shouldInitStats) {
      owningTile.statLevels[TileStat.SellAmount] = 1;
      owningTile.statLevels[TileStat.SellRate] = 1;

      owningTile.statCosts[TileStat.SellAmount] = 1500;
      owningTile.statCosts[TileStat.SellRate] = 1500;
    }

    this.mapService = mapService;
    this.resourcesService = resourcesService;

    this.soldResources = resourcesService.getResources(resourceType);

    this.homeTile = mapService.tileMap.filter(tile => tile.buildingTileType === BuildingTileType.Home)[0];
    this.owningTile = owningTile;

    this.calculateConnection();
  }

  public tick(elapsed: number, deltaTime: number) {
    if (this.tilePath.length && elapsed - this.lastSellTime > this.sellInterval) {
      this.timeSinceLastSale += deltaTime;

      const resource = this.soldResources[this.currentResource];
      const sellAmount = Math.min(this.sellQuantity, resource.amount - resource.autoSellCutoff);

      if (sellAmount > 0) {
        this.mapService.spawnSoldResourceAnimation(resource.resourceEnum, sellAmount, this);
        this.lastSellTime = elapsed;

        resource.addAmount(-sellAmount);

        this.logSale(sellAmount * resource.sellsFor);

        this.timeSinceLastSale = 0;
      }

      if (this.timeSinceLastSale >= 1000) {
        this.logSale(0);
        this.timeSinceLastSale = 0;
      }

      do {
        this.currentResource = (this.currentResource + 1) % this.soldResources.length;
      } while (!this.soldResources[this.currentResource].sellable);
    }
  }

  logSale(profit: number) {
    this.recentSales.push(profit);
    if (this.recentSales.length >= this.recentWindowSize) {
      this.recentSales = this.recentSales.slice(1, this.recentWindowSize);
    }
  }

  public calculateConnection() {
    this.mapService.findPath(this.homeTile, this.owningTile, true, true).subscribe(path => {
      this.tilePath = path;
    });
  }

  public get averageRecentProfit(): number {
    if (!this.recentSales.length) {
      return 0;
    }

    return this.recentSales.reduce((total, sale) => total += sale) / this.recentSales.length;
  }
}
