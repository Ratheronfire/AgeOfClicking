import { Injectable } from '@angular/core';
import { AdminManager } from './admin.manager';
import { BuildingsManager } from './buildings.manager';
import { EnemyManager } from './enemy.manager';
import { HarvestManager } from './harvest.manager';
import { MapManager } from './map.manager';
import { MessagesManager } from './messages.manager';
import { ResourcesManager } from './resources.manager';
import { SettingsManager } from './settings.manager';
import { StoreManager } from './store.manager';
import { TooltipManager } from './tooltip.manager';
import { UnitManager } from './unit.manager';
import { UpgradesManager } from './upgrades.manager';
import { WorkersManager } from './workers.manager';
import { MatSnackBar, MatDialog } from '@angular/material';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  admin: AdminManager;
  buildings: BuildingsManager;
  enemy: EnemyManager;
  harvest: HarvestManager;
  map: MapManager;
  messages: MessagesManager;
  resources: ResourcesManager;
  settings: SettingsManager;
  store: StoreManager;
  tooltip: TooltipManager;
  unit: UnitManager;
  upgrades: UpgradesManager;
  workers: WorkersManager;

  constructor(protected snackbar: MatSnackBar, public dialog: MatDialog) {
    this.admin = new AdminManager(this);
    this.settings = new SettingsManager(this, snackbar, dialog);
    this.messages = new MessagesManager(this);
    this.tooltip = new TooltipManager(this);

    this.resources = new ResourcesManager(this);
    this.harvest = new HarvestManager(this);
    this.workers = new WorkersManager(this);
    this.store = new StoreManager(this);
    this.upgrades = new UpgradesManager(this);

    this.map = new MapManager(this);
    this.unit = new UnitManager(this);
    this.enemy = new EnemyManager(this);
    this.buildings = new BuildingsManager(this);

    this.settings.setAutosave();
  }
}
