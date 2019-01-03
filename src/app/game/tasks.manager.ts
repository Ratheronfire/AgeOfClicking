import { UnitTask } from './../objects/task/unitTask';
import { TaskType } from './../objects/task/task';
import { GameService } from './game.service';
import { Task } from '../objects/task/task';

declare var require: any;
const baseTasks = require('../../assets/json/tasks.json');

export class TasksManager {
  tasks: Task[] = [];

  private game: GameService;

  constructor(game: GameService) {
    this.game = game;

    for (const baseTask of baseTasks) {
      switch (baseTask.taskType) {
        case TaskType.Unit: {
          this.tasks.push(new UnitTask(baseTask.title, baseTask.id, baseTask.rewards, baseTask.isTutorial,
            baseTask.tutorialText, this.game, baseTask.numberRequired, baseTask.unitTypes));
        }
      }
    }
  }

  tick(elapsed: number, deltaTime: number) {
    for (const task of this.lockedTasks) {
      task.updateProgress();
    }
  }

  get lockedTasks(): Task[] {
    return this.tasks.filter(task => !task.isUnlocked);
  }
}
