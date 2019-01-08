import { GameService } from 'src/app/game/game.service';
import { ResourceEnum } from 'src/app/objects/resourceData';
import { MessageSource } from '../message';

export enum TaskType {
  Unit = 'UNIT'
}

export interface TaskReward {
  resourceEnum: ResourceEnum;
  amount: number;
}

export abstract class Task {
  id: number;
  title: string;

  isTutorial: boolean;
  tutorialText: string;

  rewards: TaskReward[];

  progress: number;

  protected game: GameService;

  constructor(title: string, id: number, rewards: TaskReward[], isTutorial = false, tutorialText = '', game: GameService) {
    this.id = id;
    this.title = title;
    this.rewards = rewards;

    this.isTutorial = isTutorial;
    this.tutorialText = tutorialText;

    this.game = game;
  }

  updateProgress() {
    if (this.isUnlocked) {
      for (const reward of this.rewards) {
        const resource = this.game.resources.getResource(reward.resourceEnum);
        resource.addAmount(reward.amount);
      }

      this.log('Task complete: ' + this.title);
      this.game.tasks.completedEvent.emit(this);
    }
  }

  get isUnlocked(): boolean {
    return this.progress >= 1;
  }

  private log(message: string) {
    this.game.messages.add(MessageSource.Tasks, message);
  }
}
