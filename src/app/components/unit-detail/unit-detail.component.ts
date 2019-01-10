import { Merchant } from './../../objects/entity/unit/merchant';
import { Component, OnInit } from '@angular/core';
import { Resource } from 'src/app/objects/resource';
import { Unit } from '../../objects/entity/unit/unit';
import { ResourceEnum } from '../../objects/resourceData';
import { GameService } from './../../game/game.service';
import { Harvester } from './../../objects/entity/unit/harvester';
import { UnitStats } from './../../objects/entity/unit/unit';
import { ResourceType } from './../../objects/resourceData';


@Component({
  selector: 'app-unit-detail',
  templateUrl: './unit-detail.component.html',
  styleUrls: ['./unit-detail.component.css']
})
export class UnitDetailComponent implements OnInit {
  snapSetting = 'lowerLeft';
  resourceTypes = ResourceType;

  constructor(protected game: GameService) { }

  ngOnInit() {
  }

  getResources(resourceType: ResourceType, filterBySellable = false) {
    return this.game.resources.getResources(resourceType, null, filterBySellable, true, true, false);
  }

  getResource(resourceEnum: ResourceEnum) {
    return this.game.resources.getResource(resourceEnum);
  }

  getResourceTypes(filterBySellable = false): ResourceType[] {
    const resourceTypes = [];

    for (const resource of this.getResources(null, filterBySellable)) {
      if (!resourceTypes.includes(resource.resourceType)) {
        resourceTypes.push(resource.resourceType);
      }
    }

    return resourceTypes;
  }

  removeUnit() {
    if (!this.focusedUnit) {
      return;
    }

    this.focusedUnit.destroy();

    this.focusedTile = undefined;
    this.focusedUnit = undefined;
  }

  toggleFollowUnit() {
    if (!this.focusedUnit) {
      return;
    }

    this.followingUnit = !this.followingUnit;

    if (this.followingUnit) {
      this.game.map.mainCamera.startFollow(this.focusedUnit);
    } else {
      this.game.map.mainCamera.stopFollow();
    }
  }

  setHarvesterTask(newResource: Resource) {
    if (this.focusedHarvester) {
      this.focusedHarvester.setResource(newResource);
    }
  }

  setMerchantTask(newResourceType: ResourceType) {
    if (this.focusedMerchant) {
      this.focusedMerchant.setResourceType(newResourceType);
    }
  }

  get focusedTile(): Phaser.Tilemaps.Tile {
    return this.game.map.focusedTile;
  }

  set focusedTile(value: Phaser.Tilemaps.Tile) {
    this.game.map.focusedTile = value;
  }

  get focusedUnit(): Unit {
    return this.game.map.focusedUnit;
  }

  set focusedUnit(value: Unit) {
    this.game.map.focusedUnit = value;
  }

  get focusedStats(): UnitStats {
    if (!this.focusedUnit) {
      return null;
    }

    return this.focusedUnit.stats;
  }

  get followingUnit(): boolean {
    return this.game.map.followingUnit;
  }

  set followingUnit(value: boolean) {
    this.game.map.followingUnit = value;
  }

  get focusedHarvester(): Harvester {
    if (!(this.focusedUnit instanceof Harvester)) {
      return null;
    }

    return this.focusedUnit as Harvester;
  }

  get focusedMerchant(): Merchant {
    if (!(this.focusedUnit instanceof Merchant)) {
      return null;
    }

    return this.focusedUnit as Merchant;
  }
}
