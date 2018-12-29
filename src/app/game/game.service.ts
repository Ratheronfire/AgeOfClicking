import { Injectable } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AdminManager } from './admin.manager';
import { BuildingsManager } from './buildings.manager';
import { EnemyManager } from './enemy.manager';
import { HarvestManager } from './harvest.manager';
import { MapManager } from './map.manager';
import { MessagesManager } from './messages.manager';
import { PathfindingManager } from './pathfinding-manager';
import { ResourcesManager } from './resources.manager';
import { SettingsManager } from './settings.manager';
import { StoreManager } from './store.manager';
import { TooltipManager } from './tooltip.manager';
import { UnitManager } from './unit.manager';
import { UpgradesManager } from './upgrades.manager';

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
  pathfinding: PathfindingManager;
  resources: ResourcesManager;
  settings: SettingsManager;
  store: StoreManager;
  tooltip: TooltipManager;
  unit: UnitManager;
  upgrades: UpgradesManager;

  constructor(protected snackbar: MatSnackBar, public dialog: MatDialog) {
    this.admin = new AdminManager(this);
    this.settings = new SettingsManager(this, snackbar, dialog);
    this.messages = new MessagesManager(this);
    this.tooltip = new TooltipManager(this);

    this.resources = new ResourcesManager(this);
    this.harvest = new HarvestManager(this);
    this.store = new StoreManager(this);
    this.upgrades = new UpgradesManager(this);

    this.map = new MapManager(this);
    this.pathfinding = new PathfindingManager(this);
    this.unit = new UnitManager(this);
    this.enemy = new EnemyManager(this);
    this.buildings = new BuildingsManager(this);

    this.settings.setAutosave();
  }
}
