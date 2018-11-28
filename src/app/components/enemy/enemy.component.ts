import { GameService } from './../../game/game.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-enemy',
  templateUrl: './enemy.component.html',
  styleUrls: ['./enemy.component.css']
})
export class EnemyComponent implements OnInit {
  constructor(public game: GameService) { }

  ngOnInit() {
  }
}
