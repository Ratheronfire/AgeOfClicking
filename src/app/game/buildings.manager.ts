import { GameService } from './game.service';
import { BuildingTileData, BuildingTileType } from '../objects/tile/tile';

export class BuildingsManager {
  buildingTileTypes = BuildingTileType;

  selectedBuilding: BuildingTileData;

  private game: GameService;

  constructor(game: GameService) {
    this.game = game;
  }

  public refundBuilding(buildingData: BuildingTileData, healthPercentage: number) {
    for (const resourceCost of buildingData.resourceCosts) {
      this.game.resources.getResource(resourceCost.resourceEnum).addAmount(resourceCost.resourceCost * 0.85 * healthPercentage);
    }
  }

  public get buildingUpgrades(): BuildingTileType[] {
    const buildingUpgrades: BuildingTileType[] = [];

    this.game.map.buildingTileData.forEach(buildingData => {
      if (buildingData.upgradeBuilding && !buildingUpgrades.includes(buildingData.upgradeBuilding)) {
        buildingUpgrades.push(buildingData.upgradeBuilding);
      }
    });

    return buildingUpgrades;
  }

  getTotalPlaced(buildingTileType: BuildingTileType, onlyBuilt = false): number {
    let allPlaced = this.game.map.getBuildingTiles(buildingTileType);

    if (onlyBuilt) {
      allPlaced = allPlaced.filter(tile => tile.properties['buildingNode'].health === tile.properties['buildingNode'].maxHealth);
    }

    if (allPlaced === undefined) {
      return 0;
    }

    return allPlaced.length;
  }
}
