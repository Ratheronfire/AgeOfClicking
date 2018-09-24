import { Component, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material';

import { SettingsService } from '../../services/settings/settings.service';
import { ResourcesService } from './../../services/resources/resources.service';
import { MessagesService } from './../../services/messages/messages.service';
import { ResourceEnum } from '../../objects/resourceData';
import { MessageSource } from './../../objects/message';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements AfterViewInit {
  messageSources = MessageSource;
  resourceBindErrorState = false;

  constructor(public settingsService: SettingsService,
              public resourcesService: ResourcesService,
              public messagesService: MessagesService) {
  }

  ngAfterViewInit() {
    this.loadGame();
    this.setAutosave();
  }

  setAutosave() {
    this.settingsService.setAutosave();
  }

  saveGame() {
    this.settingsService.saveGame();
  }

  loadGame() {
    this.settingsService.loadGame();

    this.bindSelected.setValue(this.resourceBinds);
    this.resourceBindChange({'source': null, 'value': this.resourceBinds});
  }

  deleteGame() {
    if (confirm('Are you sure you want to delete your save?')) {
      this.settingsService.deleteSave();
    }
  }

  resourceBindChange(event: MatSelectChange) {
    this.settingsService.resourceBindChange(event);
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

  get resourceAnimationColors(): {} {
    return this.settingsService.resourceAnimationColors;
  }
  set resourceAnimationColors(value: {}) {
    this.settingsService.resourceAnimationColors = value;
  }

  get slimInterface(): boolean {
    return this.settingsService.slimInterface;
  }
  set slimInterface(value: boolean) {
    this.settingsService.slimInterface = value;
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
