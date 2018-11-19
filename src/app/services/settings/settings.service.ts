import { FormControl } from '@angular/forms';
import { Injectable } from '@angular/core';
import { MatSnackBar, MatDialog, MatSelectChange } from '@angular/material';

import { AboutDialogComponent } from './../../components/about-dialog/about-dialog/about-dialog.component';
import { SaveDialogComponent } from '../../components/save-dialog/save-dialog.component';
import { ResourcesService } from './../resources/resources.service';
import { UpgradesService } from './../upgrades/upgrades.service';
import { WorkersService } from './../workers/workers.service';
import { MessagesService } from '../messages/messages.service';
import { MapService } from './../map/map.service';
import { EnemyService } from './../enemy/enemy.service';
import { FighterService } from './../fighter/fighter.service';
import { Tick } from './../tick/tick.service';
import { ResourceType, ResourceEnum } from './../../objects/resourceData';
import { SaveData, WorkerData, TileData } from '../../objects/savedata';
import { BuildingTileType, BuildingSubType, Market } from '../../objects/tile';
import { Enemy, Fighter, ResourceAnimationType } from '../../objects/entity';
import { MessageSource } from './../../objects/message';
import { Vector } from '../../objects/vector';

const defaultResourceBinds = [ResourceEnum.Oak, ResourceEnum.Pine, ResourceEnum.Birch, ResourceEnum.Stone, ResourceEnum.Graphite,
  ResourceEnum.Limestone, ResourceEnum.CopperOre, ResourceEnum.TinOre, ResourceEnum.BronzeIngot, ResourceEnum.IronOre];

@Injectable({
  providedIn: 'root'
})
export class SettingsService implements Tick {
  versionHistory = ['1.2', 'Alpha 3', 'Alpha 3.1', 'Alpha 3.2', 'Alpha 3.3', 'Alpha 3.4', 'Alpha 4.0'];
  gameVersion = 'Alpha 4.0';

  bindSelected = new FormControl();

  autosaveInterval = 60000;
  lastAutosave = Date.now();
  debugMode = false;

  resourceBinds = defaultResourceBinds;

  disableAnimations = false;
  slimInterface = false;
  organizeLeftPanelByType = true;

  mapDetailMode = true;
  mapLowFramerate = false;

  harvestDetailColor = '#a4ff89';
  workerDetailColor = '#ae89ff';
  resourceAnimationColors = {
    'PLAYERSPAWNED': '#a4ff89',
    'WORKERSPAWNED': 'ae89ff',
    'SOLD': '#ffc089'
  };

  constructor(protected resourcesService: ResourcesService,
              protected upgradesService: UpgradesService,
              protected workersService: WorkersService,
              protected mapService: MapService,
              protected enemyService: EnemyService,
              protected fighterService: FighterService,
              protected messagesService: MessagesService,
              protected snackbar: MatSnackBar,
              public dialog: MatDialog) { }

  tick(elapsed: number, deltaTime: number) {
    if (elapsed - this.lastAutosave < this.autosaveInterval || this.autosaveInterval < 0) {
      return;
    }

    this.lastAutosave = elapsed;
    this.saveGame();
  }

  resourceBindChange(event: MatSelectChange) {
    const limitExceeded = event.value.length > 10;
    this.bindSelected.setErrors({'length': limitExceeded});

    if (!limitExceeded) {
      this.resourceBinds = event.value;

      for (const resource of this.resourcesService.getResources()) {
        resource.bindIndex = -1;
      }

      for (const resourceBind of this.resourceBinds) {
        const resource = this.resourcesService.resources.get(resourceBind);
        resource.bindIndex = this.resourceBinds.indexOf(resourceBind);
      }
    }
  }

  openSaveDialog(saveData?: string) {
    const dialogRef = this.dialog.open(SaveDialogComponent, {
      width: '750px',
      height: '150px',
      data: saveData === undefined ? {} : {saveData: saveData}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        if (this.importSave(result, true)) {
          this.snackbar.open('Game successfully loaded!', '', {duration: 2000});
          this.log('Game successfully loaded!');
        }
      }
    });
  }

  openAboutDialog() {
    const dialogRef = this.dialog.open(AboutDialogComponent, {
      width: '750px',
      height: '550px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        if (this.importSave(result, true)) {
        }
      }
    });
  }

  setAutosave() {
    this.lastAutosave = Date.now();
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

    if (this.importSave(saveData, true)) {
      this.snackbar.open('Game successfully loaded!', '', {duration: 2000});
      this.log('Game successfully loaded!');
    }
  }

  /** Deletes the save data stored to the browser and resets the game.
   *  @param manualDeletion True if the delete was triggered by the player (we automatically delete
   *    the save before loading to ensure we're working from a clean slate).
   */
  deleteSave(manualDeletion: boolean) {
    localStorage.removeItem('clickerGameSaveData');

    this.resourcesService.loadBaseResources();
    this.upgradesService.loadBaseUpgrades();
    this.workersService.loadBaseWorkers();

    this.mapService.seedRng(Math.random());
    this.mapService.initializeMap();

    this.workersService.foodStockpile = 0;

    this.autosaveInterval = 60000;
    this.setAutosave();

    this.debugMode = false;

    this.resourcesService.highestTierReached = 0;

    this.workersService.workersPaused = false;

    this.resourceBinds = defaultResourceBinds;
    this.bindSelected.setValue(this.resourceBinds);
    this.resourceBindChange({'source': null, 'value': this.resourceBinds});

    this.messagesService.visibleSources = [MessageSource.Admin, MessageSource.Buildings, MessageSource.Main, MessageSource.Enemy,
      MessageSource.Fighter, MessageSource.Map, MessageSource.Resources, MessageSource.Settings,
      MessageSource.Store, MessageSource.Upgrades, MessageSource.Workers];

    this.enemyService.enemiesActive = false;

    this.disableAnimations = false;
    this.slimInterface = false;
    this.organizeLeftPanelByType = true;

    this.mapLowFramerate = false;
    this.resourceAnimationColors = {
      'PLAYERSPAWNED': '#a4ff89',
      'WORKERSPAWNED': 'ae89ff',
      'SOLD': '#ffc089'
    };

    if (manualDeletion) {
      this.snackbar.open('Game save deleted.', '', {duration: 2000});
      this.log('Game save deleted.');
    }
  }

  exportSave() {
    const saveData: SaveData = {
      resources: [],
      purchasedUpgrades: [],
      workers: [],
      tiles: [],
      enemies: [],
      fighters: [],
      settings: {
        autosaveInterval: this.autosaveInterval,
        debugMode: this.debugMode,
        highestTierReached: this.resourcesService.highestTierReached,
        workersPaused: this.workersService.workersPaused,
        hidePurchasedUpgrades: this.upgradesService.hidePurchasedUpgrades,
        resourceBinds: this.resourceBinds,
        visibleSources: this.messagesService.visibleSources,
        enemiesActive: this.enemyService.enemiesActive,
        slimInterface: this.slimInterface,
        organizeLeftPanelByType: this.organizeLeftPanelByType,
        mapLowFramerate: this.mapLowFramerate,
        resourceAnimationColors: this.resourceAnimationColors,
        prngSeed: this.mapService.prngSeed
      },
      foodStockpile: this.workersService.foodStockpile,
      gameVersion: this.gameVersion
    };

    for (const resource of this.resourcesService.getResources()) {
      saveData.resources.push({
        resourceEnum: resource.resourceEnum,
        amount: resource.amount,
        autoSellCutoff: resource.autoSellCutoff
      });
    }

    saveData.purchasedUpgrades = this.upgradesService.getUpgrades(true).map(upgrade => upgrade.id);

    for (const worker of this.workersService.getWorkers()) {
      const workerData: WorkerData = {
        resourceType: worker.resourceType,
        cost: worker.cost,
        workerCount: worker.workerCount,
        workersByResource: []
      };

      for (const resourceWorker of worker.getResourceWorkers()) {
        workerData.workersByResource.push({
          resourceEnum: resourceWorker.resourceEnum,
          workable: resourceWorker.workable,
          workerCount: resourceWorker.workerCount
        });
      }

      saveData.workers.push(workerData);
    }

    if (this.mapService.mapLayer) {
      for (const tile of this.mapService.mapLayer.getTilesWithin()) {
        if (!tile || !tile.properties['buildingNode']) {
          continue;
        }

        const tileData: TileData = {
          id: tile.properties['id'],
          health: tile.properties['buildingNode'].health,
          maxHealth: tile.properties['buildingNode'].maxHealth,
          buildingRemovable: tile.properties['buildingNode'].removable,
          statLevels: tile.properties['buildingNode'].statLevels,
          statCosts: tile.properties['buildingNode'].statCosts
        };

        if (tile.properties['resourceNode']) {
          tileData.resourceTileType = tile.properties['resourceNode'].tileType;
        }
        if (tile.properties['buildingNode']) {
          tileData.buildingTileType = tile.properties['buildingNode'].tileType;
        }

        if (tile.properties['buildingNode'].market) {
          tileData.sellInterval = tile.properties['buildingNode'].market.sellInterval;
          tileData.sellQuantity = tile.properties['buildingNode'].market.sellQuantity;
        }

        saveData.tiles.push(tileData);
      }
    }

    for (const enemy of this.enemyService.enemies) {
      saveData.enemies.push({
        name: enemy.name,
        x: enemy.x,
        y: enemy.y,
        health: enemy.health,
        maxHealth: enemy.maxHealth,
        animationSpeed: enemy.animationSpeed,
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
        x: fighter.x,
        y: fighter.y,
        health: fighter.health,
        maxHealth: fighter.maxHealth,
        animationSpeed: fighter.animationSpeed,
        attack: fighter.attack,
        defense: fighter.defense,
        attackRange: fighter.attackRange,
        moveable: fighter.moveable,
        fireMilliseconds: fighter.fireMilliseconds,
        cost: fighter.cost,
        statLevels: fighter.statLevels,
        statCosts: fighter.statCosts
      });
    }

    return btoa(JSON.stringify(saveData));
  }

  importSave(saveDataString: string, backUpFirst: boolean): boolean {
    let backupSave;
    if (backUpFirst) {
      backupSave = this.exportSave();
    }

    try {
      this.deleteSave(false);

      let saveData: SaveData = JSON.parse(atob(saveDataString));
      saveData = this.processVersionDifferences(saveData);

      if (!saveData.gameVersion) {
        throw new Error('Save data is incompatible with the current version.');
      }

      if (saveData.settings !== undefined) {
        this.autosaveInterval = saveData.settings.autosaveInterval ? saveData.settings.autosaveInterval : 900000;
        this.debugMode = saveData.settings.debugMode ? saveData.settings.debugMode : false;

        this.resourcesService.highestTierReached = saveData.settings.highestTierReached ? saveData.settings.highestTierReached : 0;

        this.workersService.workersPaused = saveData.settings.workersPaused ? saveData.settings.workersPaused : false;
        this.upgradesService.hidePurchasedUpgrades =
          saveData.settings.hidePurchasedUpgrades ? saveData.settings.hidePurchasedUpgrades : false;

        this.resourceBinds = saveData.settings.resourceBinds ? saveData.settings.resourceBinds : defaultResourceBinds;
        this.bindSelected.setValue(this.resourceBinds);
        this.resourceBindChange({'source': null, 'value': this.resourceBinds});

        this.messagesService.visibleSources = saveData.settings.visibleSources ? saveData.settings.visibleSources :
          [MessageSource.Admin, MessageSource.Buildings, MessageSource.Main, MessageSource.Enemy,
            MessageSource.Fighter, MessageSource.Map, MessageSource.Resources, MessageSource.Settings,
            MessageSource.Store, MessageSource.Upgrades, MessageSource.Workers];

        this.enemyService.enemiesActive = saveData.settings.enemiesActive ? saveData.settings.enemiesActive : false;

        this.slimInterface = saveData.settings.slimInterface ? saveData.settings.slimInterface : false;
        this.organizeLeftPanelByType = saveData.settings.organizeLeftPanelByType ? saveData.settings.organizeLeftPanelByType : true;

        this.mapLowFramerate = saveData.settings.mapLowFramerate ? saveData.settings.mapLowFramerate : false;

        this.harvestDetailColor = saveData.settings.harvestDetailColor ? saveData.settings.harvestDetailColor : '#a4ff89';
        this.workerDetailColor = saveData.settings.workerDetailColor ? saveData.settings.workerDetailColor : '#ae89ff';
        if (saveData.settings.resourceAnimationColors) {
          this.resourceAnimationColors = saveData.settings.resourceAnimationColors;
        }

        if (saveData.settings.prngSeed) {
          this.mapService.seedRng(saveData.settings.prngSeed);
          this.mapService.initializeMap();
        }
      }

      if (saveData.resources !== undefined) {
        for (const resourceData of saveData.resources) {
          const resource = this.resourcesService.resources.get(resourceData.resourceEnum);

          if (resource === undefined) {
            continue;
          }

          resource.amount = resourceData.amount ? resourceData.amount : 0;
          resource.autoSellCutoff = resourceData.autoSellCutoff ? resourceData.autoSellCutoff : 0;
        }
      }

      if (saveData.purchasedUpgrades !== undefined) {
        for (const upgradeId of saveData.purchasedUpgrades) {
          const upgrade = this.upgradesService.getUpgrade(upgradeId);

          if (upgrade) {
            upgrade.applyUpgrade(true);
            upgrade.purchased = true;
          }
        }
      }

      if (saveData.workers !== undefined) {
        for (const workerData of saveData.workers) {
          const worker = this.workersService.workers.get(workerData.resourceType);

          worker.cost = workerData.cost;
          worker.workerCount = workerData.workerCount;
          worker.freeWorkers = workerData.workerCount;

          for (const resourceWorkerData of workerData.workersByResource) {
            const resourceWorker = worker.resourceWorkers.get(resourceWorkerData.resourceEnum);

            resourceWorker.workable = resourceWorkerData.workable;
            resourceWorker.workerCount = 0;

            resourceWorker.sliderSetting = resourceWorkerData.workerCount;

            worker.updateResourceWorker(resourceWorkerData.resourceEnum, resourceWorkerData.workerCount);
          }

          if (worker.freeWorkers < 0) {
            throw new Error('Invalid worker settings.');
          }
        }
      }

      if (saveData.tiles !== undefined) {
        for (const tileData of saveData.tiles) {
          const tile = this.mapService.mapLayer.findTile(_tile => _tile && _tile.properties['id'] === tileData.id);

          if (!tile || tileData.buildingTileType === BuildingTileType.Home) {
            continue;
          }

          const buildingData = this.mapService.buildingTileData.get(tileData.buildingTileType);
          this.mapService.createBuilding(tile.x, tile.y, buildingData, tileData.buildingRemovable, tileData.maxHealth, true);

          tile.properties['buildingNode'].health = tileData.health ? tileData.health : 50;
          tile.properties['buildingNode'].statLevels = tileData.statLevels;
          tile.properties['buildingNode'].statCosts = tileData.statCosts;

          if (tileData.buildingTileType &&
            this.mapService.buildingTileData.get(tileData.buildingTileType).subType === BuildingSubType.Market) {

            let resourceType: ResourceType;
            switch (tileData.buildingTileType) {
              case BuildingTileType.WoodMarket: {
                resourceType = ResourceType.Wood;
                break;
              } case BuildingTileType.MineralMarket: {
                resourceType = ResourceType.Mineral;
                break;
              } case BuildingTileType.MetalMarket: {
                resourceType = ResourceType.Metal;
                break;
              }
            }

            tile.properties['buildingNode'].market = new Market(this.mapService, this.resourcesService, resourceType, tile, false);
          }
        }
      }

      if (saveData.enemies !== undefined) {
        for (const enemyData of saveData.enemies) {
          const tile = this.mapService.mapLayer.getTileAtWorldXY(enemyData.x, enemyData.y);

          if (!tile) {
            continue;
          }

          const enemyType = this.enemyService.enemyTypes.find(type => type.name === enemyData.name);
          const enemy = this.mapService.spawnEnemy(enemyType, tile);

          enemy.health = enemyData.health ? enemyData.health : 50;
          enemy.maxHealth = enemyData.maxHealth ? enemyData.maxHealth : 50;
        }
      }

      if (saveData.fighters !== undefined) {
        for (const fighterData of saveData.fighters) {
          const tile = this.mapService.mapLayer.getTileAtWorldXY(fighterData.x, fighterData.y);

          if (!tile) {
            continue;
          }

          const fighterType = this.fighterService.fighterTypes.find(type => type.name === fighterData.name);
          const fighter = this.mapService.spawnFighter(fighterType, tile.x, tile.y, true);

          fighter.health = fighterData.health ? fighterData.health : 50;
          fighter.maxHealth = fighterData.maxHealth ? fighterData.maxHealth : 50;
          fighter.attackRange = fighterData.attackRange ? fighterData.attackRange : 3;
          if (fighterData.statLevels) {
            fighter.statLevels = fighterData.statLevels;
          }
          if (fighterData.statCosts) {
            fighter.statCosts = fighterData.statCosts;
          }
        }
      }

      this.workersService.foodStockpile = saveData.foodStockpile ? saveData.foodStockpile : 0;
      this.mapService.calculateResourceConnections();

      return true;
    } catch (error) {
      if (backUpFirst) {
        this.snackbar.open(`Error loading save data: ${error}`, '', {duration: 5000});
        this.log('Error loading save data. Printing data to console for debugging.');
        this.importSave(backupSave, false);

        console.error('Error processesing save data. Printing to console for debugging:\n' + saveDataString + '\n' + error);
      } else {
        console.error('Error encountered restoring backed-up save:\n' + error);
      }

      return false;
    }
  }

  processVersionDifferences(saveData: any): SaveData {
    const legacyResourceIds = {
      0: 'GOLD',
      1: 'OAK',
      2: 'COPPERORE',
      3: 'TINORE',
      4: 'BRONZEINGOT',
      5: 'IRONORE',
      6: 'IRONINGOT',
      7: 'PINE',
      8: 'BIRCH',
      9: 'EUCALYPTUS',
      10: 'STEELINGOT',
      11: 'GOLDORE',
      12: 'GOLDINGOT',
      13: 'STONE',
      15: 'WILLOW',
      16: 'ENTSOUL',
      17: 'REANIMATEDENT',
      18: 'LATINUMORE',
      19: 'LATINUMINGOT',
      20: 'UNBELIEVIUMORE',
      21: 'LUSTRIALORE',
      22: 'SPECTRUSORE',
      23: 'TEMPROUSINGOT',
      24: 'REFINEDTEMPROUS',
      25: 'TEAK',
      26: 'GRAPHITE',
      27: 'LIMESTONE',
      28: 'MARBLE',
      29: 'QUARTZ',
      30: 'OBSIDIAN',
      31: 'DIAMOND'
    };

    const legacyWorkerIds = {
      0: 'WOOD',
      1: 'METAL',
      2: 'MINERAL'
    };

    const oldVersionIndex = this.versionHistory.indexOf(saveData.gameVersion);

    if (oldVersionIndex <= this.versionHistory.indexOf('1.2')) {
      for (const resourceData of saveData.resources) {
        const resource = this.resourcesService.resources.get(legacyResourceIds[resourceData.resourceId]);
        resourceData.sellsFor = resource.sellsFor;
      }
    }

    if (oldVersionIndex <= this.versionHistory.indexOf('Alpha 3')) {
      saveData.settings.resourceAnimationColors = {};
      saveData.settings.resourceAnimationColors[ResourceAnimationType.PlayerSpawned] = saveData.settings.harvestDetailColor;
      saveData.settings.resourceAnimationColors[ResourceAnimationType.WorkerSpawned] = saveData.settings.workerDetailColor;
      saveData.settings.resourceAnimationColors[ResourceAnimationType.Sold] = '#ffc089';

      saveData.tiles.map(tileData => {
        const isMarket = this.mapService.buildingTileData.get(tileData.buildingTileType).subType === BuildingSubType.Market;
        tileData.statLevels = isMarket ? {'MAXHEALTH': 1, 'SELLAMOUNT': 1, 'SELLRATE': 1} : {'MAXHEALTH': 1};
        tileData.statCosts = isMarket ? {'MAXHEALTH': 1500, 'SELLAMOUNT': 1500, 'SELLRATE': 1500} : {'MAXHEALTH': 1500};
      });
    }

    if (oldVersionIndex <= this.versionHistory.indexOf('Alpha 3.1')) {
      saveData.purchasedUpgrades = saveData.upgrades.map(upgrade => upgrade.id);

      for (const resourceData of saveData.resources) {
        resourceData.resourceEnum = legacyResourceIds[resourceData.id];
      }

      for (const workerData of saveData.workers) {
        workerData.resourceType = legacyWorkerIds[workerData.id];

        for (const resourceWorkerData of workerData.workersByResource) {
          resourceWorkerData.resourceEnum = legacyResourceIds[resourceWorkerData.resourceId];
        }
      }

      for (const enemyData of saveData.enemies) {
        const newResourcesToSteal = enemyData.resourcesToSteal.map(resourceId => legacyResourceIds[resourceId]);
        const newResourcesHeld = new Map<ResourceEnum, number>();

        if (!enemyData.resourcesHeld || !enemyData.resourcesHeld.length) {
          continue;
        }

        for (const resourceId of enemyData.resourcesToSteal) {
          const amountHeld = enemyData.resourcesHeld[resourceId];
          newResourcesHeld.set(legacyResourceIds[resourceId], amountHeld === undefined ? 0 : amountHeld);
        }

        enemyData.resourcesToSteal = newResourcesToSteal;
        enemyData.resourcesHeld = newResourcesHeld;
      }

      if (saveData.settings.resourceBinds) {
        saveData.settings.resourceBinds = saveData.settings.resourceBinds.map(resourceId => legacyResourceIds[resourceId]);
      }

      const accessedTiers = saveData.resources.filter(resource => resource.amount).map(resource =>
        this.resourcesService.resources.get(resource.resourceEnum).resourceTier);
      saveData.settings.highestTierReached = accessedTiers.sort()[accessedTiers.length - 1];
    }

    if (oldVersionIndex <= this.versionHistory.indexOf('Alpha 3.4')) {
      saveData.tiles = [];
    }

    return saveData;
  }

  private log(message: string) {
    console.log(message);
    this.messagesService.add(MessageSource.Settings, message);
  }
}
