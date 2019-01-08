import { EventEmitter } from '@angular/core';
import { Task } from '../objects/task/task';
import { TaskType } from './../objects/task/task';
import { UnitTask } from './../objects/task/unitTask';
import { GameService } from './game.service';

declare var require: any;
const baseTasks = require('../../assets/json/tasks.json');

export class TasksManager {
  tasks: Task[] = [];

  completedEvent: EventEmitter<Task> = new EventEmitter();

  private game: GameService;

  constructor(game: GameService) {
    this.game = game;

    for (const baseTask of baseTasks) {
      switch (baseTask.taskType) {
        case TaskType.Unit: {
          this.tasks.push(new UnitTask(baseTask.title, baseTask.id, baseTask.rewards, baseTask.isTutorial,
            baseTask.tutorialText, this.game, baseTask.numberRequired, baseTask.requiredIsTotal, baseTask.unitTypes));
        }
      }
    }
  }

  tick(elapsed: number, deltaTime: number) {
    for (const task of this.incompleteTasks) {
      task.updateProgress();
    }
  }

  get incompleteTasks(): Task[] {
    return this.tasks.filter(task => !task.isUnlocked);
  }

  get completeTasks(): Task[] {
    return this.tasks.filter(task => task.isUnlocked);
  }
}
