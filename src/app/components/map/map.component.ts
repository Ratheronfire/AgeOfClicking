import { Component } from '@angular/core';

import { MapTileType, BuildingTileType } from '../../objects/tile';
import { MapService } from '../../services/map/map.service';
import { BuildingsService } from './../../services/buildings/buildings.service';
import { EnemyService } from './../../services/enemy/enemy.service';
import { AdminService } from '../../services/admin/admin.service';
import { ResourcesService } from '../../services/resources/resources.service';

declare var d3: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent {
  mapTileTypes = MapTileType;
  buildingTileTypes = BuildingTileType;

  constructor(public mapService: MapService,
              public buildingsService: BuildingsService,
              public resourcesService: ResourcesService,
              public enemyService: EnemyService,
              public adminService: AdminService) { }

  clearFocus() {
    this.mapService.focusedTile = undefined;
    this.mapService.focusedUnit = undefined;
  }

  setPlacementGroupVisibility(buildingVisibility: boolean, unitVisibility: boolean) {
    this.mapService.buildingListVisible = buildingVisibility;
    this.mapService.unitListVisible = unitVisibility;
  }
}
