import { Component, AfterViewInit } from '@angular/core';
import { MatSelectChange } from '@angular/material';

import { SettingsService } from '../../services/settings/settings.service';
import { MapService } from '../../services/map/map.service';
import { ResourcesService } from '../../services/resources/resources.service';
import { MessagesService } from '../../services/messages/messages.service';
import { ResourceEnum } from '../../objects/resourceData';
import { MessageSource } from '../../objects/message';
import { Resource } from '../../objects/resource';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements AfterViewInit {
  messageSources = MessageSource;
  resourceBindErrorState = false;

  constructor(public settingsService: SettingsService,
              public mapService: MapService,
              public resourcesService: ResourcesService,
              public messagesService: MessagesService) {
  }

  ngAfterViewInit() {
    this.waitForMapAndLoad();
    this.setAutosave();
  }

  setAutosave() {
    this.settingsService.setAutosave();
  }

  saveGame() {
    this.settingsService.saveGame();
  }

  waitForMapAndLoad() {
    setTimeout(_ => this.loadGame(), 1000);
  }

  loadGame() {
    if (this.mapService.mapCreated) {
      this.settingsService.loadGame();

      this.bindSelected.setValue(this.resourceBinds);
      this.resourceBindChange({'source': null, 'value': this.resourceBinds});
    } else {
      setTimeout(_ => this.loadGame(), 1000);
    }
  }

  deleteGame() {
    if (confirm('Are you sure you want to delete your save?')) {
      this.settingsService.deleteSave();
    }
  }

  getResources(filterBySellable = false, filterByAccessible = false, filterByHarvestable = false, filterByEdible = false): Resource[] {
    return this.resourcesService.getResources(null, null, filterBySellable, filterByAccessible, filterByHarvestable, filterByEdible);
  }

  resourceBindChange(event: MatSelectChange) {
    this.settingsService.resourceBindChange(event);
  }

  openAboutDialog() {
    this.settingsService.openAboutDialog();
  }

  exportSave() {
    this.settingsService.openSaveDialog(this.settingsService.exportSave());
  }

  importSave() {
    this.settingsService.openSaveDialog();
  }

  get bindSelected() {
    return this.settingsService.bindSelected;
  }

  get autosaveInterval() {
    return this.settingsService.autosaveInterval;
  }
  set autosaveInterval(value: number) {
    this.settingsService.autosaveInterval = value;
  }

  get debugMode(): boolean {
    return this.settingsService.debugMode;
  }
  set debugMode(value: boolean) {
    this.settingsService.debugMode = value;
  }

  get mapLowFramerate(): boolean {
    return this.settingsService.mapLowFramerate;
  }
  set mapLowFramerate(value: boolean) {
    this.settingsService.mapLowFramerate = value;
  }

  get resourceAnimationColors() {
    return this.settingsService.resourceAnimationColors;
  }
  set resourceAnimationColors(value) {
    this.settingsService.resourceAnimationColors = value;
  }

  get slimInterface(): boolean {
    return this.settingsService.slimInterface;
  }
  set slimInterface(value: boolean) {
    this.settingsService.slimInterface = value;
  }

  get organizeLeftPanelByType(): boolean {
    return this.settingsService.organizeLeftPanelByType;
  }
  set organizeLeftPanelByType(value: boolean) {
    this.settingsService.organizeLeftPanelByType = value;
  }

  get disableAnimations(): boolean {
    return this.settingsService.disableAnimations;
  }
  set disableAnimations(value: boolean) {
    this.settingsService.disableAnimations = value;
  }

  get resourceBinds(): ResourceEnum[] {
    return this.settingsService.resourceBinds;
  }
  set resourceBinds(value: ResourceEnum[]) {
    this.settingsService.resourceBinds = value;
  }
}
