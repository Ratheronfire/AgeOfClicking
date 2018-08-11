import { Component, OnInit } from '@angular/core';

import { Resource } from '../resource';
import { ResourcesService } from '../resources.service';
import { Upgrade, ResourceCost } from '../upgrade';
import { UpgradesService } from '../upgrades.service';

@Component({
  selector: 'app-upgrades',
  templateUrl: './upgrades.component.html',
  styleUrls: ['./upgrades.component.css']
})
export class UpgradesComponent implements OnInit {
  constructor(private resourcesService: ResourcesService,
              private upgradesService: UpgradesService) { }

  ngOnInit() {
  }
  
  purchaseUpgrade(id: number) {
    this.upgradesService.purchaseUpgrade(id);
  }
  
  getBackgroundColor(id: number): string {
    const upgrade = this.upgradesService.upgrades[id];
    
    if (upgrade.purchased)
      return 'lightgreen';
    else if (!this.upgradesService.canAffordUpgrade(id))
      return 'gray';
    
    return 'lightblue';
  }
}
