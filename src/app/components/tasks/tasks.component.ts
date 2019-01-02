import { GameService } from 'src/app/game/game.service';
import { Component } from '@angular/core';
import { Task } from 'src/app/objects/task/task';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent {

  constructor(protected game: GameService) { }

  get tasks(): Task[] {
    return this.game.tasks.tasks;
  }
}
