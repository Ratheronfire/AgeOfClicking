import { Component } from '@angular/core';

import { UpgradesService } from './services/upgrades/upgrades.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'clicker-game';
  debugMode = true;

  constructor(protected upgradesService: UpgradesService) {
  }

  get affordableUpgradeCount(): number {
    const upgrades = this.upgradesService.getUpgrades(false, true, true);
    const affordableUpgrades = upgrades.filter(upgrade => this.upgradesService.canAffordUpgrade(upgrade.id));

    return affordableUpgrades.length;
  }
}
