import { GameService } from './../../game/game.service';
import { UnitType } from './../entity/unit/unit';
import { Task, TaskReward } from './task';

export class UnitTask extends Task {
  private unitTypes?: UnitType[];
  private numberRequired: number;

  constructor(title: string, id: number, rewards: TaskReward[], isTutorial = false, tutorialText = '', game: GameService,
      numberRequired: number, unitTypes?: UnitType | UnitType[]) {
    super(title, id, rewards, isTutorial, tutorialText, game);

    this.numberRequired = numberRequired;

    if (unitTypes && unitTypes.length) {
      this.unitTypes = [].concat(unitTypes);
    } else {
      this.unitTypes = [];
    }
  }

  updateProgress() {
    let totalRequired = 0;
    let totalSpawned = 0;

    if (!this.unitTypes.length) {
      totalRequired = this.numberRequired;
      totalSpawned = this.game.unit.getUnits().length;
    } else {
      totalRequired = this.unitTypes.length * this.numberRequired;
      totalSpawned = this.unitTypes
        .map(unitType => this.game.unit.getUnits(unitType).length)
        .reduce((total, amount) => total += amount);
    }

    this.progress = totalSpawned / totalRequired;
  }
}
