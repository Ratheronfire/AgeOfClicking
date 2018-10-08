import { Component, OnInit } from '@angular/core';

import { MapTileType, Tile, BuildingTileType, MapTile, BuildingTile } from '../../objects/tile';
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
export class MapComponent implements OnInit {
  mapTileTypes = MapTileType;
  buildingTileTypes = BuildingTileType;

  constructor(public mapService: MapService,
              public buildingsService: BuildingsService,
              public resourcesService: ResourcesService,
              public enemyService: EnemyService,
              public adminService: AdminService) { }

  ngOnInit() {
    this.mapService.initializeMap();
  }

  clearFocus() {
    this.mapService.focusedTile = undefined;
    this.mapService.focusedBuildingTile = undefined;
    this.mapService.focusedResourceTile = undefined;
    this.mapService.focusedResources = undefined;
    this.mapService.focusedFighter = undefined;
  }

  setPlacementGroupVisibility(buildingVisibility: boolean, fighterVisibility: boolean) {
    this.mapService.buildingListVisible = buildingVisibility;
    this.mapService.fighterListVisible = fighterVisibility;
  }

  get deleteMode(): boolean {
    return this.mapService.deleteMode;
  }

  set deleteMode(value) {
    this.mapService.deleteMode = value;
  }
}
