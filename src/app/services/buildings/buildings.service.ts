import { Injectable } from '@angular/core';

import { Tile, BuildingTileType, BuildingTile } from '../../objects/tile';
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
    const buildingTile = this.mapService.buildingTiles[buildingType];

    if (tile.buildingTileType !== undefined ||
        tile.resourceTileType !== undefined ||
        !buildingTile.buildableSurfaces.some(bs => bs === tile.mapTileType) ||
        !this.canAffordBuilding(buildingTile)) {
      return false;
    }

    for (const resourceCost of buildingTile.resourceCosts) {
      this.resourcesService.addResourceAmount(resourceCost.resourceId, -resourceCost.resourceCost);
    }

    if (buildingTile.placesResourceTile) {
      tile.resourceTileType = buildingTile.resourceTileType;
    }

    tile.health = buildingTile.baseHealth;
    tile.maxHealth = buildingTile.baseHealth;

    tile.buildingRemovable = true;
    tile.buildingTileType = buildingType;
    this.mapService.calculateResourceConnections();

    return true;
  }

  public canAffordBuilding(buildingTile: BuildingTile): boolean {
    for (const resourceCost of buildingTile.resourceCosts) {
      if (this.resourcesService.getResource(resourceCost.resourceId).amount < resourceCost.resourceCost) {
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

    for (const resourceCost of buildingTile.resourceCosts) {
      this.resourcesService.addResourceAmount(resourceCost.resourceId, resourceCost.resourceCost * 0.85);
    }

    this.mapService.calculateResourceConnections();

    return true;
  }

  public canRepairBuilding(tile: Tile): boolean {
    const buildingTile: BuildingTile = this.mapService.buildingTiles[tile.buildingTileType];

    return this.resourcesService.getResource(buildingTile.repairResource).amount >=
      buildingTile.repairCostPerPoint * (tile.maxHealth - tile.health);
  }

  public repairBuilding(tile: Tile) {
    if (!this.canRepairBuilding(tile)) {
      return;
    }
    const buildingTile: BuildingTile = this.mapService.buildingTiles[tile.buildingTileType];
    const healAmount = tile.maxHealth - tile.health;

    this.resourcesService.addResourceAmount(buildingTile.repairResource, -buildingTile.repairCostPerPoint * healAmount);
    tile.health = tile.maxHealth;

    this.mapService.calculateResourceConnections();
  }
}
