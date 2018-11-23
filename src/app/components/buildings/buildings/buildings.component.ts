import { Component, OnInit } from '@angular/core';
import { Resource } from '../../../objects/resource';
import { ResourceEnum } from '../../../objects/resourceData';
import { BuildingTileData, BuildingTileType } from '../../../objects/tile';
import { BuildingsService } from '../../../services/buildings/buildings.service';
import { MapService } from '../../../services/map/map.service';
import { ResourcesService } from '../../../services/resources/resources.service';
import { SettingsService } from '../../../services/settings/settings.service';
import { UnitService } from '../../../services/unit/unit.service';


@Component({
  selector: 'app-buildings',
  templateUrl: './buildings.component.html',
  styleUrls: ['./buildings.component.css']
})
export class BuildingsComponent implements OnInit {
  constructor(protected resourcesService: ResourcesService,
              protected buildingsService: BuildingsService,
              protected unitService: UnitService,
              protected settingsService: SettingsService,
              protected mapService: MapService) { }

  ngOnInit() {
  }

  selectBuilding(buildingTile: BuildingTileData) {
    if (this.selectedBuilding === buildingTile) {
      this.selectedBuilding = undefined;
    } else {
      this.unitService.selectedUnitType = undefined;
      this.selectedBuilding = buildingTile;
    }
  }

  canAffordBuilding(buildingType: BuildingTileType): boolean {
    return this.buildingsService.canAffordBuilding(this.buildingTiles.get(buildingType));
  }

  get buildingTiles() {
    return this.mapService.buildingTileData;
  }

  getBuildingTileArray(filterByPlaceable: boolean): BuildingTileData[] {
    let tiles = Array.from(this.mapService.buildingTileData.values());

    if (filterByPlaceable) {
      tiles = tiles.filter(tile => tile.placeable);
    }

    return tiles;
  }

  getResource(resourceEnum: ResourceEnum): Resource {
    return this.resourcesService.resources.get(resourceEnum);
  }

  get selectedBuilding(): BuildingTileData {
    return this.buildingsService.selectedBuilding;
  }

  set selectedBuilding(value) {
    this.buildingsService.selectedBuilding = value;
  }
}
