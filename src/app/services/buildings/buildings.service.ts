import { Injectable } from '@angular/core';

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
}
