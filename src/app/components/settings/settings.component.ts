import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatSelectChange } from '@angular/material';

import { SettingsService } from '../../services/settings/settings.service';
import { ResourcesService } from './../../services/resources/resources.service';
import { MessagesService } from './../../services/messages/messages.service';
import { MessageSource } from './../../objects/message';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  bindSelected = new FormControl();

  messageSources = MessageSource;
  resourceBindErrorState = false;

  constructor(protected settingsService: SettingsService,
              protected resourcesService: ResourcesService,
              protected messagesService: MessagesService) {
    this.bindSelected.setValue(this.resourceBinds);
    this.resourceBindChange({'source': null, 'value': this.resourceBinds});
  }

  ngOnInit() {
  }

  setAutosave() {
    this.settingsService.setAutosave();
  }

  saveGame() {
    this.settingsService.saveGame();
  }

  loadGame() {
    this.settingsService.loadGame();
  }

  deleteGame() {
    if (confirm('Are you sure you want to delete your save?')) {
      this.settingsService.deleteSave();
    }
  }

  resourceBindChange(event: MatSelectChange) {
    const limitExceeded = event.value.length > 10;
    this.bindSelected.setErrors({'length': limitExceeded});

    if (!limitExceeded) {
      this.resourceBinds = event.value;

      for (const resource of this.resourcesService.resources) {
        resource.bindIndex = -1;
      }

      for (const resourceBind of this.resourceBinds) {
        const resource = this.resourcesService.getResource(resourceBind);
        resource.bindIndex = this.resourceBinds.indexOf(resourceBind);
      }
    }
  }

  exportSave() {
    this.settingsService.openSaveDialog(this.settingsService.exportSave());
  }

  importSave() {
    this.settingsService.openSaveDialog();
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

  get harvestDetailColor(): string {
    return this.settingsService.harvestDetailColor;
  }
  set harvestDetailColor(value: string) {
    this.settingsService.harvestDetailColor = value;
  }

  get workerDetailColor(): string {
    return this.settingsService.workerDetailColor;
  }
  set workerDetailColor(value: string) {
    this.settingsService.workerDetailColor = value;
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

  get resourceBinds(): number[] {
    return this.settingsService.resourceBinds;
  }
  set resourceBinds(value: number[]) {
    this.settingsService.resourceBinds = value;
  }
}
