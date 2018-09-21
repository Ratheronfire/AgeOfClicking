import { Component, ChangeDetectorRef } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';

import { UpgradesService } from './services/upgrades/upgrades.service';
import { EnemyService } from './services/enemy/enemy.service';
import { SettingsService } from './services/settings/settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  sidebarWidth = 600;
  hideResourceList = false;
  mobileQuery: MediaQueryList;

  private _mobileQueryListener: () => void;

  constructor(protected upgradesService: UpgradesService,
              protected enemyService: EnemyService,
              protected settingsService: SettingsService,
              protected changeDetectorRef: ChangeDetectorRef,
              protected media: MediaMatcher) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);

    // window.onbeforeunload = event => {
    //   const message = 'Are you sure you want to leave this page? Unsaved data will be lost.';
    //   if (!event) {
    //     event = window.event;
    //   }

    //   event.returnValue = message;

    //   return message;
    // };
  }

  get affordableUpgradeCount(): number {
    const upgrades = this.upgradesService.getUpgrades(false, true, true);
    const affordableUpgrades = upgrades.filter(upgrade => this.upgradesService.canAffordUpgrade(upgrade.id));

    return affordableUpgrades.length;
  }

  get disableAnimations(): boolean {
    return this.settingsService.disableAnimations;
  }

  get debugMode(): boolean {
    return this.settingsService.debugMode;
  }
}
