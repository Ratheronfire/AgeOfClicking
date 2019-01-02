import { GameService } from 'src/app/game/game.service';
import { ResourceEnum } from 'src/app/objects/resourceData';

export enum TaskType {
  Unit = 'UNIT'
}

export interface TaskReward {
  resourceEnum: ResourceEnum;
  amount: number;
}

export abstract class Task {
  title: string;

  isTutorial: boolean;
  tutorialText: string;

  rewards: TaskReward[];

  progress: number;

  protected game: GameService;

  constructor(title: string, rewards: TaskReward[], isTutorial = false, tutorialText = '', game: GameService) {
    this.title = title;
    this.rewards = rewards;

    this.isTutorial = isTutorial;
    this.tutorialText = tutorialText;

    this.game = game;
  }

  updateProgress() {}

  get isUnlocked(): boolean {
    return this.progress >= 1;
  }
}
