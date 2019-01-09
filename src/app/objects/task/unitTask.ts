import { GameService } from './../../game/game.service';
import { UnitType } from './../entity/unit/unit';
import { Task, TaskReward } from './task';

export class UnitTask extends Task {
  private unitTypes?: UnitType[];

  private numberRequired: number;
  private requiredIsTotal: boolean;

  constructor(title: string, id: number, rewards: TaskReward[], isTutorial = false, tutorialText = '', game: GameService,
      numberRequired: number, requiredIsTotal = true, unitTypes?: UnitType | UnitType[]) {
    super(title, id, rewards, isTutorial, tutorialText, game);

    this.numberRequired = numberRequired;
    this.requiredIsTotal = requiredIsTotal;

    if (unitTypes && unitTypes.length) {
      this.unitTypes = [].concat(unitTypes);
    } else {
      this.unitTypes = [];
    }
  }

  updateProgress() {
    let totalRequired = this.numberRequired;
    let totalSpawned = 0;

    if (!this.unitTypes.length) {
      totalSpawned = this.game.unit.getUnits().length;
    } else {
      if (!this.requiredIsTotal) {
        totalRequired *= this.unitTypes.length;
      }

      totalSpawned = this.unitTypes
        .map(unitType => this.game.unit.getUnits(unitType).length)
        .reduce((total, amount) => total += amount);
    }

    this.progress = totalSpawned / totalRequired;

    super.updateProgress();
  }
}
