import { Component, OnInit } from '@angular/core';

import { SettingsService } from '../../services/settings/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  constructor(protected settingsService: SettingsService) { }

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

  exportSave() {
    this.settingsService.openSaveDialog(this.settingsService.exportSave());
  }

  importSave() {
    this.settingsService.openSaveDialog();
    // this.settingsService.importSave(prompt('Paste Save Data'));
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

  get mapDetailMode(): boolean {
    return this.settingsService.mapDetailMode;
  }

  set mapDetailMode(value: boolean) {
    this.settingsService.mapDetailMode = value;
  }

  get mapLowFramerate(): boolean {
    return this.settingsService.mapLowFramerate;
  }

  set mapLowFramerate(value: boolean) {
    this.settingsService.mapLowFramerate = value;
  }

  get resourceDetailColor(): string {
    return this.settingsService.resourceDetailColor;
  }

  set resourceDetailColor(value: string) {
    this.settingsService.resourceDetailColor = value;
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
}
