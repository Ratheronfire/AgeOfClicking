import { EnemyService } from './../../../services/enemy/enemy.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-enemy',
  templateUrl: './enemy.component.html',
  styleUrls: ['./enemy.component.css']
})
export class EnemyComponent implements OnInit {
  constructor(protected enemyService: EnemyService) { }

  ngOnInit() {
  }
}
