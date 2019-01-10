import { BuildingTileType } from '../tile/tile';
import { GameService } from './../../game/game.service';
import { Task, TaskReward } from './task';

export class BuildingTask extends Task {
  private requiredBuildingTypes?: BuildingTileType[];

  private numberRequired: number;
  private requiredIsTotal: boolean;
  private onlyUpgradedBuildings: boolean;

  constructor(title: string, id: number, rewards: TaskReward[], isTutorial = false, tutorialText = '', game: GameService,
      numberRequired: number, requiredIsTotal = true,
      buildingTypes?: BuildingTileType | BuildingTileType[], onlyUpgradedBuildings = false) {
    super(title, id, rewards, isTutorial, tutorialText, game);

    this.numberRequired = numberRequired;
    this.requiredIsTotal = requiredIsTotal;
    this.onlyUpgradedBuildings = onlyUpgradedBuildings;

    if (buildingTypes && buildingTypes.length) {
      this.requiredBuildingTypes = [].concat(buildingTypes);
    } else {
      this.requiredBuildingTypes = [];
    }
  }

  updateProgress() {
    let totalRequired = this.numberRequired;
    let totalSpawned = 0;

    if (this.onlyUpgradedBuildings) {
      totalSpawned = this.game.buildings.buildingUpgrades
        .map(buildingType => this.game.buildings.getTotalPlaced(buildingType, true))
        .reduce((total, amount) => total += amount);
    } else if (!this.requiredBuildingTypes.length) {
      totalSpawned = this.game.map.getBuildingTiles().length;
    } else {
      if (!this.requiredIsTotal) {
        totalRequired *= this.requiredBuildingTypes.length;
      }

      totalSpawned = this.requiredBuildingTypes
        .map(buildingType => this.game.buildings.getTotalPlaced(buildingType, true))
        .reduce((total, amount) => total += amount);
    }

    this.progress = totalSpawned / totalRequired;

    super.updateProgress();
  }
}
