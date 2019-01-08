import { GameService } from 'src/app/game/game.service';
import { Component, Inject } from '@angular/core';
import { Task } from 'src/app/objects/task/task';
import { MatSnackBar, MAT_SNACK_BAR_DATA } from '@angular/material';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent {

  constructor(protected game: GameService, protected snackBar: MatSnackBar) {
    this.game.tasks.completedEvent.subscribe(task => this.onTaskComplete(task));
  }

  get tasks(): Task[] {
    return this.game.tasks.tasks;
  }

  onTaskComplete(task: Task) {
    console.log(`Task complete: ${task.title}`);

    this.snackBar.openFromComponent(TaskPopupComponent, {
      data: task
    });
  }
}

@Component({
  selector: 'app-tasks-popup',
  templateUrl: 'app-tasks-popup.html',
})
export class TaskPopupComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public task: any) {
  }
}
