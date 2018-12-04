import { GameService } from './game.service';
import { BuildingTileData, BuildingTileType } from '../objects/tile/tile';

export class BuildingsManager {
  buildingTileTypes = BuildingTileType;

  selectedBuilding: BuildingTileData;
  totalBuildingsPlaced = new Map<BuildingTileType, number>();

  private game: GameService;

  constructor(game: GameService) {
    this.game = game;
  }

  public canPlaceBuilding(buildingData: BuildingTileData): boolean {
    const totalPlaced = this.getTotalPlaced(buildingData.tileType);

    return buildingData.maxPlaceable <= 0 || totalPlaced < buildingData.maxPlaceable;
  }

  public placeBuilding(buildingData: BuildingTileData) {
    const buildingType = buildingData.tileType;

    if (!this.totalBuildingsPlaced.has(buildingData.tileType)) {
      this.totalBuildingsPlaced.set(buildingType, 1);
    } else {
      this.totalBuildingsPlaced.set(buildingType, this.totalBuildingsPlaced.get(buildingType) + 1);
    }
  }

  public refundBuilding(buildingData: BuildingTileData, healthPercentage: number) {
    if (!this.totalBuildingsPlaced.has(buildingData.tileType)) {
      this.totalBuildingsPlaced.set(buildingData.tileType, 0);
    } else {
      this.totalBuildingsPlaced.set(buildingData.tileType, this.totalBuildingsPlaced.get(buildingData.tileType) - 1);
    }

    for (const resourceCost of buildingData.resourceCosts) {
      this.game.resources.getResource(resourceCost.resourceEnum).addAmount(resourceCost.resourceCost * 0.85 * healthPercentage);
    }
  }

  public resetBuildings() {
    this.totalBuildingsPlaced.clear();
  }

  getTotalPlaced(buildingTileType: BuildingTileType): number {
    let totalPlaced = this.totalBuildingsPlaced.get(buildingTileType);
    if (totalPlaced === undefined) {
      totalPlaced = 0;
    }

    return totalPlaced;
  }
}
