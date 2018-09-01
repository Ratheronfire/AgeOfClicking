import { Injectable } from '@angular/core';
import { MatSnackBar, MatDialog } from '@angular/material';

import { timer, Observable, Subscription } from 'rxjs';

import { ResourcesService } from './../resources/resources.service';
import { UpgradesService } from './../upgrades/upgrades.service';
import { WorkersService } from './../workers/workers.service';
import { MapService } from './../map/map.service';
import { SaveData, WorkerData, TileData } from '../../objects/savedata';
import { SaveDialogComponent } from '../../components/save-dialog/save-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  gameVersion = '1.2';

  autosaveInterval = 900000;
  debugMode = false;

  mapDetailMode = true;
  mapLowFramerate = false;

  autosaveSource: Observable<number>;
  autosaveSubscribe: Subscription;

  constructor(protected resourcesService: ResourcesService,
              protected upgradesService: UpgradesService,
              protected workersService: WorkersService,
              protected mapService: MapService,
              protected snackbar: MatSnackBar,
              public dialog: MatDialog) {
    this.loadGame();
  }

  openSaveDialog(saveData?: string) {
    const dialogRef = this.dialog.open(SaveDialogComponent, {
      width: '750px',
      height: '150px',
      data: saveData === undefined ? {} : {saveData: saveData}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        if (this.importSave(result)) {
          this.snackbar.open('Game successfully loaded!', '', {duration: 2000});
        }
      }
    });
  }

  setAutosave() {
    if (this.autosaveSubscribe !== undefined) {
      this.autosaveSubscribe.unsubscribe();
    }

    if (this.autosaveInterval <= 0) {
      return;
    }

    this.autosaveSource = timer(this.autosaveInterval, this.autosaveInterval);
    this.autosaveSubscribe = this.autosaveSource.subscribe(_ => this.saveGame());
  }

  saveGame() {
    const saveData = this.exportSave();

    localStorage.setItem('clickerGameSaveData', saveData);

    this.snackbar.open('Game successfully saved!', '', {duration: 2000});
  }

  loadGame() {
    const saveData = localStorage.getItem('clickerGameSaveData');

    if (saveData === null) {
      return;
    }

    if (this.importSave(saveData)) {
      this.snackbar.open('Game successfully loaded!', '', {duration: 2000});
    }
  }

  deleteSave() {
    localStorage.removeItem('clickerGameSaveData');

    this.snackbar.open('Game save deleted.', '', {duration: 2000});
  }

  exportSave() {
    const saveData: SaveData = {
      resources: [],
      upgrades: [],
      workers: [],
      tiles: [],
      settings: {
        autosaveInterval: this.autosaveInterval,
        debugMode: this.debugMode,
        mapDetailMode: this.mapDetailMode,
        mapLowFramerate: this.mapLowFramerate
      },
      gameVersion: this.gameVersion
    };

    for (const resource of this.resourcesService.resources) {
      saveData.resources.push({
        id: resource.id,
        amount: resource.amount,
        harvestable: resource.harvestable,
        harvestYield: resource.harvestYield,
        harvestMilliseconds: resource.harvestMilliseconds,
        sellable: resource.sellable,
        sellsFor: resource.sellsFor,
        resourceAccessible: resource.resourceAccessible
      });
    }

    for (const upgrade of this.upgradesService.upgrades) {
      saveData.upgrades.push({
        id: upgrade.id,
        purchased: upgrade.purchased
      });
    }

    for (const worker of this.workersService.workers) {
      const workerData: WorkerData = {
        id: worker.id,
        cost: worker.cost,
        workerCount: worker.workerCount,
        workersByResource: []
      };

      for (const resourceWorker of worker.workersByResource) {
        workerData.workersByResource.push({
          resourceId: resourceWorker.resourceId,
          workable: resourceWorker.workable,
          workerCount: resourceWorker.workerCount,
          workerYield: resourceWorker.workerYield
        });
      }

      saveData.workers.push(workerData);
    }

    for (const tile of this.mapService.tiledMap) {
      if (tile.buildingTileType === undefined) {
        continue;
      }

      const tileData: TileData = {
        id: tile.id,
        buildingPath: tile.buildingPath,
        buildingRemovable: tile.buildingRemovable,
        tileCropDetail: tile.tileCropDetail
      }

      if (tile.resourceTileType !== undefined) {
        tileData.resourceTileType = tile.resourceTileType;
      }
      if (tile.buildingTileType !== undefined) {
        tileData.buildingTileType = tile.buildingTileType;
      }

      saveData.tiles.push(tileData);
    }

    console.log(saveData);
    return btoa(JSON.stringify(saveData));
  }

  importSave(saveDataString: string): boolean {
    const backupSave = this.exportSave();

    try {
      const saveData: SaveData = JSON.parse(atob(saveDataString));

      if (saveData.gameVersion !== this.gameVersion) {
        throw new Error('Save is from a different version of the game.');
      }

      if (saveData.resources) {
        for (const resourceData of saveData.resources) {
          const resource = this.resourcesService.getResource(resourceData.id);

          if (resource === undefined) {
            continue;
          }

          resource.amount = resourceData.amount;
          resource.harvestable = resourceData.harvestable;
          resource.harvestYield = resourceData.harvestYield;
          resource.harvestMilliseconds = resourceData.harvestMilliseconds;
          resource.sellable = resourceData.sellable;
          resource.sellsFor = resourceData.sellsFor;
          resource.resourceAccessible = resourceData.resourceAccessible;
        }
      }

      if (saveData.upgrades) {
        for (const upgradeData of saveData.upgrades) {
          const upgrade = this.upgradesService.getUpgrade(upgradeData.id);

          if (upgrade === undefined) {
            continue;
          }

          upgrade.purchased = upgradeData.purchased;
        }
      }

      if (saveData.workers) {
        for (const workerData of saveData.workers) {
          const worker = this.workersService.getWorker(workerData.id);

          worker.cost = workerData.cost;
          worker.workerCount = workerData.workerCount;
          worker.freeWorkers = workerData.workerCount;

          for (const resourceWorkerData of workerData.workersByResource) {
            const resourceWorker = this.workersService.getResourceWorker(resourceWorkerData.resourceId);

            resourceWorker.workable = resourceWorkerData.workable;
            resourceWorker.workerYield = resourceWorkerData.workerYield;
            resourceWorker.workerCount = 0;

            resourceWorker.sliderSetting = resourceWorkerData.workerCount;

            this.workersService.updateResourceWorker(resourceWorkerData.resourceId, resourceWorkerData.workerCount);
          }

          if (worker.freeWorkers < 0) {
            throw new Error('Invalid worker settings.');
          }
        }
      }

      if (saveData.tiles) {
        for (const tileData of saveData.tiles) {
          const tile = this.mapService.tiledMap.find(tile => tile.id === tileData.id);

          if (tile === undefined) {
            continue;
          }

          tile.resourceTileType = tileData.resourceTileType;
          tile.buildingTileType = tileData.buildingTileType;

          tile.buildingPath = tileData.buildingPath;
          tile.buildingRemovable = tileData.buildingRemovable;

          tile.tileCropDetail = tileData.tileCropDetail;
        }
      }

      this.autosaveInterval = saveData.settings.autosaveInterval;
      this.debugMode = saveData.settings.debugMode;

      this.mapDetailMode = saveData.settings.mapDetailMode;
      this.mapLowFramerate = saveData.settings.mapLowFramerate;

      this.mapService.calculateResourceConnections();

      return true;
    } catch (error) {
      this.snackbar.open(`Error loading save data: ${error}`, '', {duration: 5000});
      this.importSave(backupSave);

      console.error(error);

      return false;
    }
  }
}
