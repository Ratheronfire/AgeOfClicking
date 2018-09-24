import { Injectable } from '@angular/core';

import { ResourceType } from './../../objects/resourceData';
import { Tile, BuildingTileType, BuildingTile, BuildingSubType, Market } from '../../objects/tile';
import { ResourcesService } from './../resources/resources.service';
import { MapService } from '../map/map.service';

@Injectable({
  providedIn: 'root'
})
export class BuildingsService {
  selectedBuilding: BuildingTile;

  constructor(protected resourcesService: ResourcesService,
              protected mapService: MapService) { }

  public createBuilding(tile: Tile, buildingType: BuildingTileType): boolean {
    const buildingTile: BuildingTile = this.mapService.buildingTiles[buildingType];

    if (tile.buildingTileType !== undefined ||
        tile.resourceTileType !== undefined ||
        !buildingTile.buildableSurfaces.some(bs => bs === tile.mapTileType) ||
        !this.canAffordBuilding(buildingTile)) {
      return false;
    }

    for (const resourceCost of buildingTile.resourceCosts) {
      this.resourcesService.resources.get(resourceCost.resourceEnum).addAmount(-resourceCost.resourceCost);
    }

    if (buildingTile.placesResourceTile) {
      tile.resourceTileType = buildingTile.resourceTileType;
    }

    tile.health = buildingTile.baseHealth;
    tile.maxHealth = buildingTile.baseHealth;

    tile.buildingRemovable = true;
    tile.buildingTileType = buildingType;
    this.mapService.calculateResourceConnections();

    if (buildingTile.subType === BuildingSubType.Market) {
      let resourceType: ResourceType;
      switch (buildingTile.tileType) {
        case BuildingTileType.WoodMarket: {
          resourceType = ResourceType.Wood;
          break;
        } case BuildingTileType.MineralMarket: {
          resourceType = ResourceType.Mineral;
          break;
        } case BuildingTileType.MetalMarket: {
          resourceType = ResourceType.Metal;
          break;
        }
      }

      tile.market = new Market(this.mapService, this.resourcesService, resourceType, tile, true);
    }

    return true;
  }

  public canAffordBuilding(buildingTile: BuildingTile): boolean {
    if (buildingTile.maxPlaceable > 0 &&
        this.mapService.tiledMap.filter(tile => tile.buildingTileType === buildingTile.tileType).length >= buildingTile.maxPlaceable) {
      return false;
    }
    for (const resourceCost of buildingTile.resourceCosts) {
      if (this.resourcesService.resources.get(resourceCost.resourceEnum).amount < resourceCost.resourceCost) {
        return false;
      }
    }

    return true;
  }

  public clearBuilding(tile: Tile): boolean {
    if (!tile.buildingRemovable || !tile.buildingTileType) {
      return false;
    }

    const buildingTile = this.mapService.buildingTiles[tile.buildingTileType];

    if (buildingTile.placesResourceTile) {
      tile.resourceTileType = undefined;
    }

    tile.buildingTileType = undefined;
    tile.health = tile.maxHealth;
    tile.market = undefined;

    for (const resourceCost of buildingTile.resourceCosts) {
      this.resourcesService.resources.get(resourceCost.resourceEnum).addAmount(resourceCost.resourceCost * 0.85);
    }

    this.mapService.calculateResourceConnections();

    return true;
  }

  public canRepairBuilding(tile: Tile): boolean {
    const buildingTile: BuildingTile = this.mapService.buildingTiles[tile.buildingTileType];
    const repairResource = this.resourcesService.resources.get(buildingTile.repairResourceEnum);

    return repairResource.amount >= buildingTile.repairCostPerPoint * (tile.maxHealth - tile.health);
  }

  public repairBuilding(tile: Tile) {
    if (!this.canRepairBuilding(tile)) {
      return;
    }
    const buildingTile: BuildingTile = this.mapService.buildingTiles[tile.buildingTileType];
    const healAmount = tile.maxHealth - tile.health;

    const repairResource = this.resourcesService.resources.get(buildingTile.repairResourceEnum);
    repairResource.addAmount(-buildingTile.repairCostPerPoint * healAmount);
    tile.health = tile.maxHealth;

    this.mapService.calculateResourceConnections();
  }
}
