import { HealthBar } from './healthbar';
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
  /** A building which creates a resource-spawning node. */
  Resource = 'RESOURCE',
  /** A building which automatically sells stored resources. */
  Market = 'MARKET',
  /** A building that resources and entities can travel on. */
  Path = 'PATH',
  /** A building that blocks entity travelling. */
  Obstacle = 'OBSTACLE',
  Miscellaneous = 'MISC'
}

export enum TileStat {
  SellRate = 'SELLRATE',
  SellAmount = 'SELLAMOUNT',
  MaxHealth = 'MAXHEALTH'
}

export interface MapTileData {
  tileType: MapTileType;

  name: string;

  walkable: boolean;
}

export interface BuildingTileData {
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

export interface ResourceTileData {
  tileType: ResourceTileType;

  name: string;
  placeable: boolean;

  spawnsOn: MapTileType[];
  isNaturalResource: boolean;
  spawnRate: number;

  resourceEnums: ResourceEnum[];
}

export class BuildingNode {
  tileType: BuildingTileType;
  owningTile: Phaser.Tilemaps.Tile;

  removable: boolean;

  health: number;
  maxHealth: number;
  healthBar: HealthBar;

  market?: Market;

  statLevels = {};
  statCosts = {};

  resourcesService: ResourcesService;

  constructor(tileType: BuildingTileType, removable: boolean, health: number,
      owningTile: Phaser.Tilemaps.Tile, scene: Phaser.Scene, resourcesService: ResourcesService) {
    this.tileType = tileType;
    this.owningTile = owningTile;

    this.removable = removable;

    this.health = health;
    this.maxHealth = health;

    this.statLevels[TileStat.MaxHealth] = 1;
    this.statCosts[TileStat.MaxHealth] = 1500;

    this.healthBar = new HealthBar(owningTile, scene);

    this.resourcesService = resourcesService;
  }

  tick(elapsed: number, deltaTime: number) {
    this.healthBar.tick(elapsed, deltaTime, this.owningTile.getCenterX(), this.owningTile.getCenterY());

    if (this.market) {
      this.market.tick(elapsed, deltaTime);
    }

    if (this.health <= 0) {
      // Phaser.Tilemaps.Tile.tint seems to be somewhat broken at the moment.
      // This line tints and broken buildings in a light red color.
      this.owningTile.tint = 0x9999ff;
    }
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

  takeDamage(number) {
    this.health -= number;
    if (this.health < 0) {
      this.health = 0;
    }

    this.healthBar.updateHealthbar(this.health / this.maxHealth);
  }
}

export class ResourceNode {
  tileType: ResourceTileType;

  path?: Phaser.Tilemaps.Tile[];

  health: number;

  constructor(tileType: ResourceTileType, health: number) {
    this.tileType = tileType;
    this.path = [];
    this.health = health;
  }

  get travelMilliseconds(): number {
    return this.path ? (this.path.length - 1) * 1000 : Infinity;
  }
}

export class Market {
  mapService: MapService;
  resourcesService: ResourcesService;

  homeTile: Phaser.Tilemaps.Tile;
  owningTile: Phaser.Tilemaps.Tile;
  tilePath: Phaser.Tilemaps.Tile[];
  soldResources: Resource[];
  currentResource = 0;

  recentSales: number[] = [];
  recentWindowSize = 20;
  timeSinceLastSale = 0;

  lastSellTime = 0;
  sellInterval = 1000;
  sellQuantity = 50;

  public constructor(mapService: MapService, resourcesService: ResourcesService, resourceType: ResourceType,
      owningTile: Phaser.Tilemaps.Tile, shouldInitStats: boolean) {
    const buildingNode: BuildingNode = owningTile.properties['buildingNode'];

    if (shouldInitStats) {
      buildingNode.statLevels[TileStat.SellAmount] = 1;
      buildingNode.statLevels[TileStat.SellRate] = 1;

      buildingNode.statCosts[TileStat.SellAmount] = 1500;
      buildingNode.statCosts[TileStat.SellRate] = 1500;
    }

    this.mapService = mapService;
    this.resourcesService = resourcesService;

    this.soldResources = resourcesService.getResources(resourceType);

    this.homeTile = mapService.mapLayer.findTile(
      tile => tile.properties['buildingNode'] && tile.properties['buildingNode'].tileType === BuildingTileType.Home);
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
