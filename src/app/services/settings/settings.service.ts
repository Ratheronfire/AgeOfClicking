import { Injectable } from '@angular/core';
import { MatSnackBar, MatDialog } from '@angular/material';

import { timer, Observable, Subscription } from 'rxjs';

import { ResourcesService } from './../resources/resources.service';
import { UpgradesService } from './../upgrades/upgrades.service';
import { WorkersService } from './../workers/workers.service';
import { SaveData, WorkerData } from '../../objects/savedata';
import { SaveDialogComponent } from '../../components/save-dialog/save-dialog/save-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  autosaveInterval = 900000;

  autosaveSource: Observable<number>;
  autosaveSubscribe: Subscription;

  constructor(protected resourcesService: ResourcesService,
              protected upgradesService: UpgradesService,
              protected workersService: WorkersService,
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
      autosaveInterval: this.autosaveInterval
    };

    for (const resource of this.resourcesService.resources) {
      saveData.resources.push({
        id: resource.id,
        amount: resource.amount,
        harvestable: resource.harvestable,
        harvestYield: resource.harvestYield,
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
        }

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

    return  btoa(JSON.stringify(saveData));
  }

  importSave(saveDataString: string): boolean {
    const backupSave = this.exportSave();

    try {
      const saveData: SaveData = JSON.parse(atob(saveDataString));

      for (const resourceData of saveData.resources) {
        const resource = this.resourcesService.getResource(resourceData.id);

        resource.amount = resourceData.amount;
        resource.harvestable = resourceData.harvestable;
        resource.harvestYield = resourceData.harvestYield;
        resource.sellable = resourceData.sellable;
        resource.sellsFor = resourceData.sellsFor;
        resource.resourceAccessible = resourceData.resourceAccessible;
      }

      for (const upgradeData of saveData.upgrades) {
        const upgrade = this.upgradesService.getUpgrade(upgradeData.id);

        upgrade.purchased = upgradeData.purchased;
      }

      for (const workerData of saveData.workers) {
        const worker = this.workersService.getWorker(workerData.id);

        worker.cost = workerData.cost;
        worker.workerCount = workerData.workerCount;
        worker.freeWorkers = workerData.workerCount;

        for (const resourceWorkerData of workerData.workersByResource) {
          const resourceWorker = this.workersService.getResourceWorker(resourceWorkerData.resourceId);

          resourceWorker.workable = resourceWorkerData.workable;
          resourceWorker.workerYield = resourceWorkerData.workerYield;

          this.workersService.updateResourceWorker(resourceWorkerData.resourceId, resourceWorkerData.workerCount);
        }

        if (worker.freeWorkers < 0) {
          throw new Error('Invalid worker settings.');
        }
      }

      this.autosaveInterval = saveData.autosaveInterval;

      return true;
    } catch (error) {
      this.snackbar.open(`Error loading save data: ${error}`, '', {duration: 5000});
      this.importSave(backupSave);

      console.error(error);

      return false;
    }
  }
}
