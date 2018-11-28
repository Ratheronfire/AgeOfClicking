import { GameService } from './../../game/game.service';
import { Component } from '@angular/core';
import { MapTileType, BuildingTileType } from '../../objects/tile/tile';

declare var d3: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent {
  mapTileTypes = MapTileType;
  buildingTileTypes = BuildingTileType;

  constructor(public game: GameService) { }

  clearFocus() {
    this.game.map.focusedTile = undefined;
    this.game.map.focusedUnit = undefined;
  }

  setPlacementGroupVisibility(buildingVisibility: boolean, unitVisibility: boolean) {
    this.game.map.buildingListVisible = buildingVisibility;
    this.game.map.unitListVisible = unitVisibility;
  }
}
