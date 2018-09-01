import { Component } from '@angular/core';

import { UpgradesService } from './services/upgrades/upgrades.service';
import { SettingsService } from './services/settings/settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'clicker-game';

  constructor(protected upgradesService: UpgradesService,
              protected settingsService: SettingsService) {
  }

  get affordableUpgradeCount(): number {
    const upgrades = this.upgradesService.getUpgrades(false, true, true);
    const affordableUpgrades = upgrades.filter(upgrade => this.upgradesService.canAffordUpgrade(upgrade.id));

    return affordableUpgrades.length;
  }

  get debugMode(): boolean {
    return this.settingsService.debugMode;
  }
}
