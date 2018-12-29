import { Resource } from '../objects/resource';
import { ResourceEnum } from '../objects/resourceData';
import { GameService } from './game.service';

export class TooltipManager {
  requiredUpgrades = {
    7: 8,
    8: 8,
    9: 9,
    15: 9,
    25: 10,
    16: 11,
    17: 12,
    2: 2,
    3: 2,
    13: 2,
    26: 5,
    5: 5,
    27: 13,
    28: 13,
    11: 13,
    29: 14,
    18: 14,
    30: 14,
    31: 15,
    20: 15,
    21: 15,
    22: 15
  };

  requiredBuildings = {
    4: 'CRACKEDFORGE',
    6: 'STONEFORGE',
    10: 'IRONFORGE',
    12: 'IRONFORGE',
    19: 'GOLDFORGE',
    23: 'LATINUMFORGE',
    24: 'TEMPROUSDISTILLERY'
  };

  consumersByResource = {
    1: 16,
    7: 16,
    8: 16,
    9: 16,
    15: 16,
    25: 16,
    16: 17,
    2: 4,
    3: 4,
    5: 6,
    6: 10,
    11: 12,
    10: 19,
    12: 19,
    18: 19,
    19: 23,
    20: 23,
    21: 23,
    22: 23,
    23: 24,
    31: 24
  };

  private game: GameService;

  constructor(game: GameService) {
    this.game = game;
  }

  getResourceTooltip(resource: Resource): string {
    let tooltip = `${resource.resourceDescription}`;

    const requiredUpgrade = this.requiredUpgrades[resource.resourceEnum];
    if (requiredUpgrade) {
      const upgrade = this.game.upgrades.getUpgrade(requiredUpgrade);
      tooltip += `\nNeeded Upgrade: ${upgrade.name}.`;
    }

    const requiredBuilding = this.requiredBuildings[resource.resourceEnum];
    if (requiredBuilding) {
      const building = this.game.map.buildingTileData.get(requiredBuilding);
      tooltip += `\nNeeded Building: ${building.name}.`;
    }

    if (resource.resourceConsumes.length) {
      tooltip += '\nResources required:';
      for (const resourceConsume of resource.resourceConsumes) {
        tooltip += ` ${this.game.resources.getResource(resourceConsume.resourceEnum).name}: ${resourceConsume.cost},`;
      }
      tooltip = tooltip.substring(0, tooltip.length - 1);
      tooltip += '.';
    }

    tooltip += `\n${Math.floor(resource.harvestYield * 1000) / 1000} harvested per click ` +
               `(${Math.floor(resource.harvestMilliseconds) / 1000} seconds per harvest).`;

     return tooltip;
  }
}
