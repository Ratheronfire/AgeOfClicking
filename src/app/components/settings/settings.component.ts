import { Component, isDevMode } from '@angular/core';
import { MatSelectChange } from '@angular/material';
import { MessageSource } from '../../objects/message';
import { Resource } from '../../objects/resource';
import { ResourceEnum } from '../../objects/resourceData';
import { GameService } from './../../game/game.service';


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  messageSources = MessageSource;
  resourceBindErrorState = false;

  constructor(public game: GameService) {
  }

  setAutosave() {
    this.game.settings.setAutosave();
  }

  saveGame() {
    this.game.settings.saveGame();
  }

  loadGame() {
    if (this.game.map.mapCreated) {
      this.game.settings.loadGame();

      this.bindSelected.setValue(this.resourceBinds);
      this.resourceBindChange({'source': null, 'value': this.resourceBinds});
    } else {
      setTimeout(_ => this.loadGame(), 1000);
    }
  }

  deleteGame() {
    if (confirm('Are you sure you want to delete your save?')) {
      this.game.settings.deleteSave(true);
      this.game.map.initializeMap(false);
    }
  }

  getResources(filterBySellable = false, filterByAccessible = false, filterByHarvestable = false, filterByEdible = false): Resource[] {
    return this.game.resources.getResources(null, null, filterBySellable, filterByAccessible, filterByHarvestable, filterByEdible);
  }

  resourceBindChange(event: MatSelectChange) {
    this.game.settings.resourceBindChange(event);
  }

  openAboutDialog() {
    this.game.settings.openAboutDialog();
  }

  exportSave() {
    this.game.settings.openSaveDialog(this.game.settings.exportSave());
  }

  importSave() {
    this.game.settings.openSaveDialog();
  }

  get bindSelected() {
    return this.game.settings.bindSelected;
  }

  get autosaveInterval() {
    return this.game.settings.autosaveInterval;
  }
  set autosaveInterval(value: number) {
    this.game.settings.autosaveInterval = value;
  }

  get resourceAnimationColors() {
    return this.game.settings.resourceAnimationColors;
  }
  set resourceAnimationColors(value) {
    this.game.settings.resourceAnimationColors = value;
  }

  get organizeLeftPanelByType(): boolean {
    return this.game.settings.organizeLeftPanelByType;
  }
  set organizeLeftPanelByType(value: boolean) {
    this.game.settings.organizeLeftPanelByType = value;
  }

  get disableAnimations(): boolean {
    return this.game.settings.disableAnimations;
  }
  set disableAnimations(value: boolean) {
    this.game.settings.disableAnimations = value;
  }

  get resourceBinds(): ResourceEnum[] {
    return this.game.settings.resourceBinds;
  }
  set resourceBinds(value: ResourceEnum[]) {
    this.game.settings.resourceBinds = value;
  }

  get isDevMode() {
    return isDevMode();
  }
}
