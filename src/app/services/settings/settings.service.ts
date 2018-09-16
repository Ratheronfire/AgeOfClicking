import { Injectable } from '@angular/core';
import { MatSnackBar, MatDialog } from '@angular/material';

import { timer, Observable, Subscription } from 'rxjs';

import { ResourcesService } from './../resources/resources.service';
import { UpgradesService } from './../upgrades/upgrades.service';
import { WorkersService } from './../workers/workers.service';
import { MessagesService } from '../messages/messages.service';
import { MapService } from './../map/map.service';
import { EnemyService } from './../enemy/enemy.service';
import { FighterService } from './../fighter/fighter.service';
import { SaveData, WorkerData, TileData } from '../../objects/savedata';
import { SaveDialogComponent } from '../../components/save-dialog/save-dialog.component';
import { BuildingTileType } from '../../objects/tile';
import { Enemy, Fighter } from '../../objects/entity';
import { MessageSource } from './../../objects/message';
import { Vector } from '../../objects/vector';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  gameVersion = '1.2';

  autosaveInterval = 900000;
  debugMode = false;

  disableAnimations = false;
  slimInterface = false;

  mapDetailMode = true;
  mapLowFramerate = false;

  autosaveSource: Observable<number>;
  autosaveSubscribe: Subscription;

  resourceDetailColor = '#000000';
  harvestDetailColor = '#a4ff89';
  workerDetailColor = '#ae89ff';

  constructor(protected resourcesService: ResourcesService,
              protected upgradesService: UpgradesService,
              protected workersService: WorkersService,
              protected mapService: MapService,
              protected enemyService: EnemyService,
              protected fighterService: FighterService,
              protected messagesService: MessagesService,
              protected snackbar: MatSnackBar,
              public dialog: MatDialog) {
    this.loadGame();
    this.setAutosave();
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
          this.log('Game successfully loaded!');
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
    this.log('Game successfully saved!');
  }

  loadGame() {
    const saveData = localStorage.getItem('clickerGameSaveData');

    if (saveData === null) {
      return;
    }

    if (this.importSave(saveData)) {
      this.snackbar.open('Game successfully loaded!', '', {duration: 2000});
      this.log('Game successfully loaded!');
    }
  }

  deleteSave() {
    localStorage.removeItem('clickerGameSaveData');

    this.snackbar.open('Game save deleted.', '', {duration: 2000});
    this.log('Game save deleted.');
  }

  exportSave() {
    const saveData: SaveData = {
      resources: [],
      upgrades: [],
      workers: [],
      tiles: [],
      enemies: [],
      fighters: [],
      settings: {
        autosaveInterval: this.autosaveInterval,
        debugMode: this.debugMode,
        enemiesActive: this.enemyService.enemiesActive,
        slimInterface: this.slimInterface,
        mapLowFramerate: this.mapLowFramerate,
        harvestDetailColor: this.harvestDetailColor,
        workerDetailColor: this.workerDetailColor
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
      if (tile.buildingTileType === undefined && tile.buildingTileType !== BuildingTileType.EnemyPortal) {
        continue;
      }

      const tileData: TileData = {
        id: tile.id,
        health: tile.health,
        maxHealth: tile.maxHealth,
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

    for (const enemy of this.enemyService.enemies) {
      saveData.enemies.push({
        name: enemy.name,
        position: enemy.position,
        spawnPosition: enemy.spawnPosition,
        health: enemy.health,
        maxHealth: enemy.maxHealth,
        attack: enemy.attack,
        defense: enemy.defense,
        attackRange: enemy.attackRange,
        targetableBuildingTypes: enemy.targetableBuildingTypes,
        resourcesToSteal: enemy.resourcesToSteal,
        resorucesHeld: enemy.resourcesHeld,
        stealMax: enemy.stealMax,
        resourceCapacity: enemy.resourceCapacity
      });
    }

    for (const fighter of this.fighterService.fighters) {
      saveData.fighters.push({
        name: fighter.name,
        description: fighter.description,
        position: fighter.position,
        spawnPosition: fighter.spawnPosition,
        health: fighter.health,
        maxHealth: fighter.maxHealth,
        attack: fighter.attack,
        defense: fighter.defense,
        attackRange: fighter.attackRange,
        moveable: fighter.moveable
      });
    }

    return btoa(JSON.stringify(saveData));
  }

  importSave(saveDataString: string): boolean {
    const backupSave = this.exportSave();

    try {
      const saveData: SaveData = JSON.parse(atob(saveDataString));

      if (saveData.gameVersion !== this.gameVersion) {
        throw new Error('Save is from a different version of the game.');
      }

      if (saveData.resources !== undefined) {
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

      if (saveData.upgrades !== undefined) {
        for (const upgradeData of saveData.upgrades) {
          const upgrade = this.upgradesService.getUpgrade(upgradeData.id);

          if (upgrade === undefined) {
            continue;
          }

          upgrade.purchased = upgradeData.purchased;
        }
      }

      if (saveData.workers !== undefined) {
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

      if (saveData.tiles !== undefined) {
        for (const tileData of saveData.tiles) {
          const tile = this.mapService.tiledMap.find(_tile => _tile.id === tileData.id);

          if (tile === undefined) {
            continue;
          }

          tile.health = tileData.health ? tileData.health : 50;
          tile.maxHealth = tileData.maxHealth ? tileData.maxHealth : 50;

          tile.resourceTileType = tileData.resourceTileType;
          tile.buildingTileType = tileData.buildingTileType;

          tile.buildingRemovable = tileData.buildingRemovable;

          tile.tileCropDetail = tileData.tileCropDetail;
        }
      }

      if (saveData.enemies !== undefined) {
        for (const enemyData of saveData.enemies) {
          const tilePosition = this.mapService.clampTileCoordinates(enemyData.position.x, enemyData.position.y);
          const tile = this.mapService.getTile(tilePosition[0], tilePosition[1]);

          const enemy = new Enemy(enemyData.name, new Vector(enemyData.position.x, enemyData.position.y), tile, enemyData.health,
            enemyData.attack, enemyData.defense, enemyData.attackRange, enemyData.targetableBuildingTypes,
            enemyData.resourcesToSteal, enemyData.stealMax, enemyData.resourceCapacity);
          enemy.spawnPosition = new Vector(enemyData.spawnPosition.x, enemyData.spawnPosition.y);

          this.enemyService.findTargets(enemy);
          this.enemyService.pickTarget(enemy);
          this.enemyService.enemies.push(enemy);
        }
      }

      if (saveData.fighters !== undefined) {
        for (const fighterData of saveData.fighters) {
          const tilePosition = this.mapService.clampTileCoordinates(fighterData.position.x, fighterData.position.y);
          const tile = this.mapService.getTile(tilePosition[0], tilePosition[1]);

          const fighter = new Fighter(fighterData.name, new Vector(fighterData.position.x, fighterData.position.y),
            tile, fighterData.health, fighterData.attack, fighterData.defense,
            fighterData.attackRange, fighterData.description, 0, fighterData.moveable);

          this.fighterService.fighters.push(fighter);
        }
      }

      if (saveData.settings !== undefined) {
        this.autosaveInterval = saveData.settings.autosaveInterval ? saveData.settings.autosaveInterval : 900000;
        this.debugMode = saveData.settings.debugMode ? saveData.settings.debugMode : false;

        this.enemyService.enemiesActive = saveData.settings.enemiesActive ? saveData.settings.enemiesActive : false;

        this.slimInterface = saveData.settings.slimInterface ? saveData.settings.slimInterface : false;

        this.mapLowFramerate = saveData.settings.mapLowFramerate ? saveData.settings.mapLowFramerate : false;

        this.harvestDetailColor = saveData.settings.harvestDetailColor ? saveData.settings.harvestDetailColor : '#a4ff89';
        this.workerDetailColor = saveData.settings.workerDetailColor ? saveData.settings.workerDetailColor : '#ae89ff';
      }

      this.mapService.calculateResourceConnections();

      return true;
    } catch (error) {
      this.snackbar.open(`Error loading save data: ${error}`, '', {duration: 5000});
      this.log('Error loading save data.');
      this.importSave(backupSave);

      console.error(error);

      return false;
    }
  }

  private log(message: string) {
    this.messagesService.add(MessageSource.Settings, message);
  }
}
