import { GameService } from '../../game/game.service';
import { Component, OnInit } from '@angular/core';
import { Resource } from '../../objects/resource';
import { ResourceEnum } from '../../objects/resourceData';
import { BuildingTileData, BuildingTileType } from '../../objects/tile/tile';

@Component({
  selector: 'app-buildings',
  templateUrl: './buildings.component.html',
  styleUrls: ['./buildings.component.css']
})
export class BuildingsComponent implements OnInit {
  constructor(protected game: GameService) { }

  ngOnInit() {
  }

  selectBuilding(buildingTile: BuildingTileData) {
    if (this.selectedBuilding === buildingTile) {
      this.selectedBuilding = undefined;
    } else {
      this.game.unit.selectedUnitType = undefined;
      this.selectedBuilding = buildingTile;
    }
  }

  canAffordBuilding(buildingType: BuildingTileType): boolean {
    return this.game.buildings.canAffordBuilding(this.buildingTiles.get(buildingType));
  }

  get buildingTiles() {
    return this.game.map.buildingTileData;
  }

  getBuildingTileArray(filterByPlaceable: boolean): BuildingTileData[] {
    let tiles = Array.from(this.game.map.buildingTileData.values());

    if (filterByPlaceable) {
      tiles = tiles.filter(tile => tile.placeable);
    }

    return tiles;
  }

  getResource(resourceEnum: ResourceEnum): Resource {
    return this.game.resources.getResource(resourceEnum);
  }

  get selectedBuilding(): BuildingTileData {
    return this.game.buildings.selectedBuilding;
  }

  set selectedBuilding(value) {
    this.game.buildings.selectedBuilding = value;
  }
}
