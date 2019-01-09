import { GameService } from 'src/app/game/game.service';
import { Upgrade, UpgradeType } from '../upgrade';
import { Task, TaskReward } from './task';

export class UpgradeTask extends Task {
  private requiredUpgradeId?: number;
  private upgradeTypes?: UpgradeType[];

  private numberRequired: number;
  private requiredIsTotal: boolean;

  constructor(title: string, id: number, rewards: TaskReward[], isTutorial = false, tutorialText = '', game: GameService,
      requiredUpgradeId?: number, upgradeTypes?: UpgradeType[], numberRequired = 1, requiredIsTotal = false) {
    super(title, id, rewards, isTutorial, tutorialText, game);

    this.requiredUpgradeId = requiredUpgradeId;
    this.upgradeTypes = upgradeTypes;

    this.numberRequired = numberRequired;
    this.requiredIsTotal = requiredIsTotal;
  }

  updateProgress() {
    if (this.requiredUpgrade) {
      this.progress = this.requiredUpgrade.purchased ? 1 : 0;
    } else {
      const totalRequired = this.requiredIsTotal ? this.numberRequired : this.numberRequired * this.upgradeTypes.length;
      const upgradesPurchased = this.game.upgrades.getUpgrades(true, false, false, this.upgradeTypes).length;

      this.progress = upgradesPurchased / totalRequired;
    }

    super.updateProgress();
  }

  get requiredUpgrade(): Upgrade {
    return this.game.upgrades.getUpgrade(this.requiredUpgradeId);
  }
}
