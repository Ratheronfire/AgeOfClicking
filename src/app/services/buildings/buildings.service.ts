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

    for (const resourceCost of buildingTile.resourceCosts) {
      this.resourcesService.addResourceAmount(resourceCost.resourceId, resourceCost.resourceCost * 0.85);
    }

    this.mapService.calculateResourceConnections();

    return true;
  }

}
