import { timer } from 'rxjs';
import { MessageSource } from '../objects/message';
import { Resource } from '../objects/resource';
import { ResourceType } from '../objects/resourceData';
import { GameService } from './game.service';
import { CursorTool } from './map.manager';

export class HarvestManager {
  timeElapsed = Date.now();

  resourceTypes = ResourceType;

  private game: GameService;

  constructor(game: GameService) {
    this.game = game;

    document.addEventListener('keydown', (event) => this.processInput(event));
  }

  tick(elapsed: number, deltaTime: number) {
    this.timeElapsed = elapsed;
    for (const resource of this.game.resources.allResources.filter(_resource => _resource.harvesting)) {
      const millisecondsElapsed = elapsed - resource.harvestStartDate;
      resource.progressBarValue = Math.floor(millisecondsElapsed / resource.harvestMilliseconds * 100);
    }
  }

  processInput(event: KeyboardEvent) {
    if (event.repeat) {
      return;
    }

    switch (event.code) {
      case 'KeyQ': {
        this.game.map.cursorTool = CursorTool.PlaceBuildings;
        this.game.map.buildingListVisible = true;
        this.game.map.unitListVisible = false;
        break;
      } case 'KeyW': {
        this.game.map.cursorTool = CursorTool.ClearBuildings;
        this.game.map.buildingListVisible = false;
        this.game.map.unitListVisible = false;
        break;
      } case 'KeyE': {
        this.game.map.cursorTool = CursorTool.TileDetail;
        this.game.map.buildingListVisible = false;
        this.game.map.unitListVisible = false;
        break;
      } case 'KeyR': {
        if (!this.game.enemy.enemiesActive) {
          break;
        }

        this.game.map.cursorTool = CursorTool.PlaceUnits;
        this.game.map.buildingListVisible = false;
        this.game.map.unitListVisible = true;
        break;
      } case 'KeyT': {
        if (!this.game.enemy.enemiesActive) {
          break;
        }

        this.game.map.cursorTool = CursorTool.UnitDetail;
        this.game.map.buildingListVisible = false;
        this.game.map.unitListVisible = false;
        break;
      }
    }

    const keyDigit = +event.code.replace('Digit', '').replace('Numpad', '');

    if (!isNaN(keyDigit)) {
      const resourceEnum = this.game.settings.resourceBinds[keyDigit];
      const resource = this.game.resources.getResource(resourceEnum);

      if (resource && resource.resourceAccessible && !resource.harvesting) {
        this.startHarvesting(resource);
      }
    }
  }

  startHarvesting(resource: Resource) {
    resource.harvestStartDate = this.timeElapsed;

    if (!resource.canHarvest(resource.harvestYield)) {
      return;
    }

    resource.harvesting = true;

    const harvestTimer = timer(resource.harvestMilliseconds);
    harvestTimer.subscribe(_ => this.harvestResource(resource));
  }

  harvestResource(resource: Resource) {
    resource.amountTravelling++;

    this.game.map.spawnHarvestedResourceAnimation(resource, resource.harvestYield, true);

    if (resource.resourceTier > 3 && !this.game.enemy.enemiesActive) {
      this.game.enemy.enemiesActive = true;
      this.log('Your base has begun attracting unwanted attention...');
    }

    resource.progressBarValue = 0;
    resource.harvesting = false;
  }

  private log(message: string) {
    this.game.messages.add(MessageSource.Main, message);
  }
}
