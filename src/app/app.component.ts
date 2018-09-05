import { Component, ChangeDetectorRef } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';

import { UpgradesService } from './services/upgrades/upgrades.service';
import { SettingsService } from './services/settings/settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  hideResourceList = false;
  mobileQuery: MediaQueryList;

  private _mobileQueryListener: () => void;

  constructor(protected upgradesService: UpgradesService,
              protected settingsService: SettingsService,
              protected changeDetectorRef: ChangeDetectorRef,
              protected media: MediaMatcher) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
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
