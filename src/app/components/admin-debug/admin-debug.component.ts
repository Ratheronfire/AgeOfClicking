import { Component, OnInit } from '@angular/core';
import { Resource } from '../../objects/resource';
import { GameService } from './../../game/game.service';

@Component({
  selector: 'app-admin-debug',
  templateUrl: './admin-debug.component.html',
  styleUrls: ['./admin-debug.component.css']
})
export class AdminDebugComponent implements OnInit {
  public filterAccessible = true;

  public selectedResource: Resource;
  amount = 0;

  constructor(public game: GameService) {}

  ngOnInit() {}

  addResourceAmount(selectedResource?: Resource) {
    if (!selectedResource) {
      for (const resource of this.game.resources.allResources) {
        resource.addAmount(+this.amount);
      }

      return;
    }

    selectedResource.addAmount(+this.amount);
  }
}
