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

  set debugMode(value: boolean) {
    this.settingsService.debugMode = value;
  }
}
