import { Component, OnInit } from '@angular/core';

import { BuildingTile, BuildingTileType, Tile } from '../../../objects/tile';
import { Resource } from '../../../objects/resource';
import { ResourcesService } from '../../../services/resources/resources.service';
import { BuildingsService } from '../../../services/buildings/buildings.service';
import { FighterService } from './../../../services/fighter/fighter.service';
import { SettingsService } from '../../../services/settings/settings.service';
import { MapService } from '../../../services/map/map.service';

@Component({
  selector: 'app-buildings',
  templateUrl: './buildings.component.html',
  styleUrls: ['./buildings.component.css']
})
export class BuildingsComponent implements OnInit {
  constructor(protected resourcesService: ResourcesService,
              protected buildingsService: BuildingsService,
              protected fighterService: FighterService,
              protected settingsService: SettingsService,
              protected mapService: MapService) { }

  ngOnInit() {
  }

  selectBuilding(buildingTile: BuildingTile) {
    if (this.selectedBuilding === buildingTile) {
      this.selectedBuilding = undefined;
    } else {
      this.fighterService.selectedFighterType = undefined;
      this.selectedBuilding = buildingTile;
    }
  }

  canAffordBuilding(buildingType: BuildingTileType): boolean {
    return this.buildingsService.canAffordBuilding(this.buildingTiles[buildingType]);
  }

  createBuilding(tile: Tile, buildingType: BuildingTileType) {
    const buildingCreated = this.buildingsService.createBuilding(tile, buildingType);
  }

  clearBuilding(tile: Tile) {
    this.buildingsService.clearBuilding(tile);
  }

  get buildingTiles() {
    return this.mapService.buildingTiles;
  }

  getBuildingTileArray(filterByPlaceable: boolean): BuildingTile[] {
    let tiles = this.mapService.buildingTileArray;

    if (filterByPlaceable) {
      tiles = tiles.filter(tile => tile.placeable);
    }

    return tiles;
  }

  getResource(resourceId: number): Resource {
    return this.resourcesService.getResource(resourceId);
  }

  get selectedBuilding(): BuildingTile {
    return this.buildingsService.selectedBuilding;
  }

  set selectedBuilding(value) {
    this.buildingsService.selectedBuilding = value;
  }
}
