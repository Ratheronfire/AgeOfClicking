import { Injectable } from '@angular/core';

import { ResourceType } from './../../objects/resourceData';
import { BuildingTileType, BuildingTileData, BuildingSubType, Market } from '../../objects/tile';
import { ResourcesService } from './../resources/resources.service';

@Injectable({
  providedIn: 'root'
})
export class BuildingsService {
  selectedBuilding: BuildingTileData;
  totalBuildingsPlaced = new Map<BuildingTileType, number>();

  constructor(protected resourcesService: ResourcesService) { }

  public purchaseBuilding(buildingData: BuildingTileData) {
    const buildingType = buildingData.tileType;

    if (!this.canAffordBuilding(buildingData)) {
      return;
    }

    if (!this.totalBuildingsPlaced.has(buildingData.tileType)) {
      this.totalBuildingsPlaced.set(buildingType, 1);
    } else {
      this.totalBuildingsPlaced.set(buildingType, this.totalBuildingsPlaced.get(buildingType) + 1);
    }

    for (const resourceCost of buildingData.resourceCosts) {
      this.resourcesService.resources.get(resourceCost.resourceEnum).addAmount(-resourceCost.resourceCost);
    }
  }

  public refundBuilding(buildingData: BuildingTileData) {
    if (!this.totalBuildingsPlaced.has(buildingData.tileType)) {
      this.totalBuildingsPlaced.set(buildingData.tileType, 0);
    } else {
      this.totalBuildingsPlaced.set(buildingData.tileType, this.totalBuildingsPlaced.get(buildingData.tileType) - 1);
    }

    for (const resourceCost of buildingData.resourceCosts) {
      this.resourcesService.resources.get(resourceCost.resourceEnum).addAmount(resourceCost.resourceCost * 0.85);
    }
  }

  public createBuilding(tile: Tile, buildingType: BuildingTileType): boolean {
    const buildingTile: BuildingTileData = this.mapService.buildingTileData.get(buildingType);

    if (tile.buildingTileType !== undefined ||
        tile.resourceTileType !== undefined ||
        !buildingTile.buildableSurfaces.some(bs => bs === tile.mapTileType) ||
        !this.canAffordBuilding(buildingTile)) {
      return false;
    }

    if (!this.totalBuildingsPlaced.has(buildingType)) {
      this.totalBuildingsPlaced.set(buildingType, 1);
    } else {
      this.totalBuildingsPlaced.set(buildingType, this.totalBuildingsPlaced.get(buildingType) + 1);
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

    this.mapService.updatePaths(tile, true);

    return true;
  }

  public canAffordBuilding(buildingTile: BuildingTileData): boolean {
    if (buildingTile.maxPlaceable > 0 && this.totalBuildingsPlaced.get(buildingTile.tileType) >= buildingTile.maxPlaceable) {
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

    if (!this.totalBuildingsPlaced.has(tile.buildingTileType)) {
      this.totalBuildingsPlaced.set(tile.buildingTileType, 0);
    } else {
      this.totalBuildingsPlaced.set(tile.buildingTileType, this.totalBuildingsPlaced.get(tile.buildingTileType) - 1);
    }

    const buildingTile = this.mapService.buildingTileData.get(tile.buildingTileType);

    if (buildingTile.placesResourceTile) {
      tile.resourceTileType = undefined;
    }

    tile.buildingTileType = undefined;
    tile.health = tile.maxHealth;
    tile.market = undefined;

    for (const resourceCost of buildingTile.resourceCosts) {
      this.resourcesService.resources.get(resourceCost.resourceEnum).addAmount(resourceCost.resourceCost * 0.85);
    }

    this.mapService.updatePaths(tile, true);

    return true;
  }

  public canRepairBuilding(tile: Tile): boolean {
    const buildingTile: BuildingTileData = this.mapService.buildingTileData.get(tile.buildingTileType);
    const repairResource = this.resourcesService.resources.get(buildingTile.repairResourceEnum);

    return repairResource.amount >= buildingTile.repairCostPerPoint * (tile.maxHealth - tile.health);
  }

  public repairBuilding(tile: Tile) {
    if (!this.canRepairBuilding(tile)) {
      return;
    }
    const buildingTile: BuildingTileData = this.mapService.buildingTileData.get(tile.buildingTileType);
    const healAmount = tile.maxHealth - tile.health;

    const repairResource = this.resourcesService.resources.get(buildingTile.repairResourceEnum);
    repairResource.addAmount(-buildingTile.repairCostPerPoint * healAmount);
    tile.health = tile.maxHealth;

    this.mapService.updatePaths(tile, true);
  }
}
