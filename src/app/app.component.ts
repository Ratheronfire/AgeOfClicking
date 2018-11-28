import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { GameService } from './game/game.service';
import { ResourceEnum } from './objects/resourceData';


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

  constructor(protected game: GameService,
              protected changeDetectorRef: ChangeDetectorRef,
              protected ngZone: NgZone,
              protected media: MediaMatcher) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);

    // window.Game = window.Game || {};
    // window.Game.Resources = window.Game.Resources || {};
    // window.Game.Resources.getResources = this.getResourceNames.bind(this);
    // window.Game.Resources.add = this.addToResource.bind(this);
    // window.Game.Upgrades = window.Game.Upgrades || {};
    // window.Game.Upgrades.getUpgrades = this.getUpgrades.bind(this);
    // window.Game.Upgrades.purchase = this.purchaseUpgrade.bind(this);

    window.onbeforeunload = event => {
      const message = 'Are you sure you want to leave this page? Unsaved data will be lost.';
      if (!event) {
        event = window.event;
      }

      event.returnValue = message;

      return message;
    };
  }

  getResourceNames() {
    return this.ngZone.run(() => this.game.resources.allResources.map(resource => resource.resourceEnum));
  }

  addToResource(resourceEnum: ResourceEnum, amount: number) {
    this.ngZone.run(() => this.game.resources.getResource(resourceEnum).addAmount(amount));
  }

  getUpgrades() {
    return this.ngZone.run(() => this.game.upgrades.getUpgrades());
  }

  purchaseUpgrade(id: number) {
    return this.ngZone.run(() => this.game.upgrades.getUpgrade(id).purchaseUpgrade());
  }

  get affordableUpgradeCount(): number {
    const upgrades = this.game.upgrades.getUpgrades(false, true, true);
    const affordableUpgrades = upgrades.filter(upgrade => upgrade.canAfford());

    return affordableUpgrades.length;
  }

  get disableAnimations(): boolean {
    return this.game.settings.disableAnimations;
  }

  get debugMode(): boolean {
    return this.game.settings.debugMode;
  }
}
