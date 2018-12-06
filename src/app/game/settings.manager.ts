import { FormControl } from '@angular/forms';
import { MatSelectChange, MatDialog, MatSnackBar } from '@angular/material';
import { AboutDialogComponent } from '../components/about-dialog/about-dialog.component';
import { SaveDialogComponent } from '../components/save-dialog/save-dialog.component';
import { EnemyType } from '../objects/entity/enemy/enemy';
import { Raider } from '../objects/entity/enemy/raider';
import { ResourceAnimationType } from '../objects/entity/resourceAnimation';
import { UnitType } from '../objects/entity/unit/unit';
import { MessageSource } from '../objects/message';
import { ResourceEnum } from '../objects/resourceData';
import { SaveData, TileSaveData, WorkerSaveData } from '../objects/savedata';
import { BuildingSubType, BuildingTileType } from '../objects/tile/tile';
import { BuildingNode } from '../objects/tile/buildingNode';
import { GameService } from './game.service';

const defaultResourceBinds = [ResourceEnum.Oak, ResourceEnum.Pine, ResourceEnum.Birch, ResourceEnum.Stone, ResourceEnum.Graphite,
  ResourceEnum.Limestone, ResourceEnum.CopperOre, ResourceEnum.TinOre, ResourceEnum.BronzeIngot, ResourceEnum.IronOre];

export class SettingsManager {
  versionHistory = ['1.2', 'Alpha 3', 'Alpha 3.1', 'Alpha 3.2', 'Alpha 3.3', 'Alpha 3.4', 'Alpha 4.0', 'Alpha 4.1'];
  gameVersion = 'Alpha 4.1';

  bindSelected = new FormControl();

  autosaveInterval = 60000;
  lastAutosave = Date.now();

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

  private game: GameService;

  constructor(game: GameService, protected snackbar: MatSnackBar, public dialog: MatDialog) {
    this.game = game;
  }

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

      for (const resource of this.game.resources.allResources) {
        resource.bindIndex = -1;
      }

      for (const resourceBind of this.resourceBinds) {
        const resource = this.game.resources.getResource(resourceBind);
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

  readSave(): SaveData {
    const saveData = localStorage.getItem('clickerGameSaveData');

    return JSON.parse(atob(saveData));
  }

  saveGame() {
    const saveData = this.exportSave();

    localStorage.setItem('clickerGameSaveData', saveData);

    this.snackbar.open('Game successfully saved!', '', {duration: 2000});
    this.log('Game successfully saved!');
  }

  /** Reads saved data from localStorage and loads it.
   * @param hardLoad True if we're loading a save through the UI (as opposed to automatically loading at startup).
   * If the user initiated the load, we need to backup and clear the existing data first and re-initialize the game state.
   */
  loadGame(hardLoad = true): boolean {
    const saveData = localStorage.getItem('clickerGameSaveData');

    if (saveData === null) {
      return false;
    }

    if (this.importSave(saveData, hardLoad)) {
      this.snackbar.open('Game successfully loaded!', '', {duration: 2000});
      this.log('Game successfully loaded!');

      return true;
    } else {
      return false;
    }
  }

  /** Deletes the save data stored to the browser and resets the game.
   *  @param manualDeletion True if the delete was triggered by the player (we automatically delete
   *    the save before loading to ensure we're working from a clean slate).
   */
  deleteSave(manualDeletion: boolean) {
    if (manualDeletion) {
      localStorage.removeItem('clickerGameSaveData');
    }

    this.game.resources.loadBaseResources();
    this.game.upgrades.loadBaseUpgrades();
    this.game.workers.loadBaseWorkers();
    this.game.buildings.resetBuildings();

    if (manualDeletion) {
      this.game.map.seedRng(Math.random());
    }

    this.game.workers.foodStockpile = 0;

    this.autosaveInterval = 60000;
    this.setAutosave();

    this.game.resources.highestTierReached = 0;

    this.game.workers.workersPaused = false;

    this.resourceBinds = defaultResourceBinds;
    this.bindSelected.setValue(this.resourceBinds);
    this.resourceBindChange({'source': null, 'value': this.resourceBinds});

    this.game.messages.visibleSources = [MessageSource.Admin, MessageSource.Buildings, MessageSource.Main, MessageSource.Enemy,
      MessageSource.Unit, MessageSource.Map, MessageSource.Resources, MessageSource.Settings,
      MessageSource.Store, MessageSource.Upgrades, MessageSource.Workers];

    this.game.enemy.enemiesActive = false;

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
      units: [],
      settings: {
        autosaveInterval: this.autosaveInterval,
        highestTierReached: this.game.resources.highestTierReached,
        workersPaused: this.game.workers.workersPaused,
        hidePurchasedUpgrades: this.game.upgrades.hidePurchasedUpgrades,
        resourceBinds: this.resourceBinds,
        visibleSources: this.game.messages.visibleSources,
        enemiesActive: this.game.enemy.enemiesActive,
        slimInterface: this.slimInterface,
        organizeLeftPanelByType: this.organizeLeftPanelByType,
        mapLowFramerate: this.mapLowFramerate,
        resourceAnimationColors: this.resourceAnimationColors,
        prngSeed: this.game.map.prngSeed
      },
      foodStockpile: this.game.workers.foodStockpile,
      gameVersion: this.gameVersion
    };

    for (const resource of this.game.resources.getResources()) {
      saveData.resources.push({
        resourceEnum: resource.resourceEnum,
        amount: resource.amount,
        autoSellCutoff: resource.autoSellCutoff
      });
    }

    saveData.purchasedUpgrades = this.game.upgrades.getUpgrades(true).map(upgrade => upgrade.id);

    for (const worker of this.game.workers.getWorkers()) {
      const workerData: WorkerSaveData = {
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

    if (this.game.map.mapLayer) {
      for (const tile of this.game.map.mapLayer.getTilesWithin()) {
        if (!tile || !tile.properties['buildingNode']) {
          continue;
        }

        const tileData: TileSaveData = {
          id: tile.properties['id'],
          health: tile.properties['buildingNode'].health,
          buildingRemovable: tile.properties['buildingNode'].removable,
          statLevels: tile.properties['buildingNode'].stats.stringifiedLevels
        };

        if (tile.properties['resourceNode']) {
          tileData.resourceTileType = tile.properties['resourceNode'].tileType;
        }
        if (tile.properties['buildingNode']) {
          tileData.buildingTileType = tile.properties['buildingNode'].tileType;
        }

        saveData.tiles.push(tileData);
      }
    }

    for (const enemy of this.game.enemy.enemies) {
      saveData.enemies.push({
        enemyType: enemy.enemyType,
        x: enemy.x,
        y: enemy.y,
        health: enemy.health,
        maxHealth: enemy.maxHealth,
        animationSpeed: enemy.animationSpeed,
        attack: enemy.attack,
        defense: enemy.defense,
        attackRange: enemy.attackRange,
        targetableBuildingTypes: enemy.targetableBuildingTypes,
        resourcesToSteal: (enemy as Raider).resourcesToSteal,
        resorucesHeld: (enemy as Raider).resourcesHeld,
        stealMax: (enemy as Raider).stealMax,
        resourceCapacity: (enemy as Raider).resourceCapacity
      });
    }

    for (const unit of this.game.unit.getUnits()) {
      saveData.units.push({
        unitType: unit.unitType,
        x: unit.x,
        y: unit.y,
        health: unit.health,
        statLevels: unit.stats.stringifiedLevels
      });
    }

    return btoa(JSON.stringify(saveData));
  }

  importSave(saveDataString: string, hardLoad: boolean): boolean {
    let backupSave;
    if (hardLoad) {
      backupSave = this.exportSave();
    }

    try {
      if (hardLoad) {
        this.deleteSave(false);
      }

      let saveData: SaveData = JSON.parse(atob(saveDataString));
      saveData = this.processVersionDifferences(saveData);

      if (!saveData.gameVersion) {
        throw new Error('Save data is incompatible with the current version.');
      }

      if (saveData.settings !== undefined) {
        this.autosaveInterval = saveData.settings.autosaveInterval ? saveData.settings.autosaveInterval : 900000;

        this.game.resources.highestTierReached = saveData.settings.highestTierReached ? saveData.settings.highestTierReached : 0;

        this.game.workers.workersPaused = saveData.settings.workersPaused ? saveData.settings.workersPaused : false;
        this.game.upgrades.hidePurchasedUpgrades =
          saveData.settings.hidePurchasedUpgrades ? saveData.settings.hidePurchasedUpgrades : false;

        this.resourceBinds = saveData.settings.resourceBinds ? saveData.settings.resourceBinds : defaultResourceBinds;
        this.bindSelected.setValue(this.resourceBinds);
        this.resourceBindChange({'source': null, 'value': this.resourceBinds});

        this.game.messages.visibleSources = saveData.settings.visibleSources ? saveData.settings.visibleSources :
          [MessageSource.Admin, MessageSource.Buildings, MessageSource.Main, MessageSource.Enemy,
            MessageSource.Unit, MessageSource.Map, MessageSource.Resources, MessageSource.Settings,
            MessageSource.Store, MessageSource.Upgrades, MessageSource.Workers];

        this.game.enemy.enemiesActive = saveData.settings.enemiesActive ? saveData.settings.enemiesActive : false;

        this.slimInterface = saveData.settings.slimInterface ? saveData.settings.slimInterface : false;
        this.organizeLeftPanelByType = saveData.settings.organizeLeftPanelByType ? saveData.settings.organizeLeftPanelByType : true;

        this.mapLowFramerate = saveData.settings.mapLowFramerate ? saveData.settings.mapLowFramerate : false;

        this.harvestDetailColor = saveData.settings.harvestDetailColor ? saveData.settings.harvestDetailColor : '#a4ff89';
        this.workerDetailColor = saveData.settings.workerDetailColor ? saveData.settings.workerDetailColor : '#ae89ff';
        if (saveData.settings.resourceAnimationColors) {
          this.resourceAnimationColors = saveData.settings.resourceAnimationColors;
        }

        if (saveData.settings.prngSeed && hardLoad) {
          this.game.map.seedRng(saveData.settings.prngSeed);
          this.game.map.initializeMap(false);
        }
      }

      if (saveData.resources !== undefined) {
        for (const resourceSaveData of saveData.resources) {
          const resource = this.game.resources.getResource(resourceSaveData.resourceEnum);

          if (resource === undefined) {
            continue;
          }

          resource.amount = resourceSaveData.amount ? resourceSaveData.amount : 0;
          resource.autoSellCutoff = resourceSaveData.autoSellCutoff ? resourceSaveData.autoSellCutoff : 0;
        }
      }

      if (saveData.purchasedUpgrades !== undefined) {
        for (const upgradeId of saveData.purchasedUpgrades) {
          const upgrade = this.game.upgrades.getUpgrade(upgradeId);

          if (upgrade) {
            upgrade.applyUpgrade(true);
            upgrade.purchased = true;
          }
        }
      }

      if (saveData.workers !== undefined) {
        for (const workerSaveData of saveData.workers) {
          const worker = this.game.workers.workers.get(workerSaveData.resourceType);

          worker.cost = workerSaveData.cost;
          worker.workerCount = workerSaveData.workerCount;
          worker.freeWorkers = workerSaveData.workerCount;

          for (const resourceWorkerData of workerSaveData.workersByResource) {
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

      this.game.workers.foodStockpile = saveData.foodStockpile ? saveData.foodStockpile : 0;

      if (!this.game.map.mapLayer) {
        // The map hasn't been created yet (This will only happen when initially trying to load data on startup).
        return true;
      }

      if (saveData.tiles !== undefined) {
        for (const tileSaveData of saveData.tiles) {
          const tile = this.game.map.mapLayer.findTile(_tile => _tile && _tile.properties['id'] === tileSaveData.id);

          if (!tile || tile.properties['resourceNode'] || tileSaveData.buildingTileType === BuildingTileType.Home) {
            continue;
          }

          const buildingData = this.game.map.buildingTileData.get(tileSaveData.buildingTileType);
          this.game.map.createBuilding(tile.x, tile.y, buildingData, tileSaveData.buildingRemovable);
          const buildingNode = tile.properties['buildingNode'] as BuildingNode;

          buildingNode.setHealth(tileSaveData.health === undefined ? 50 : tileSaveData.health);

          if (!tileSaveData.statLevels) {
            continue;
          }

          for (const stat of buildingData.stats) {
            if (!tileSaveData.statLevels[stat]) {
              continue;
            }

            for (let i = tileSaveData.statLevels[stat]; i > 1; i--) {
              buildingNode.stats.upgradeStat(stat, true);
            }
          }
        }
      }

      if (saveData.enemies !== undefined) {
        for (const enemySaveData of saveData.enemies) {
          const tile = this.game.map.mapLayer.getTileAtWorldXY(enemySaveData.x, enemySaveData.y);

          if (!tile) {
            continue;
          }

          if (!enemySaveData.enemyType) {
            enemySaveData.enemyType = EnemyType.Raider;
          }

          const enemy = this.game.map.spawnEnemy(enemySaveData.enemyType, tile);

          if (!enemy) {
            continue;
          }

          enemy.health = enemySaveData.health ? enemySaveData.health : 50;
          enemy.maxHealth = enemySaveData.maxHealth ? enemySaveData.maxHealth : 50;
        }
      }

      if (saveData.units !== undefined) {
        for (const unitSaveData of saveData.units) {
          const tile = this.game.map.mapLayer.getTileAtWorldXY(unitSaveData.x, unitSaveData.y);

          if (!tile) {
            continue;
          }

          const unit = this.game.map.spawnUnit(unitSaveData.unitType, tile.x, tile.y, true);

          unit.health = unitSaveData.health ? unitSaveData.health : 50;

          if (!unitSaveData.statLevels) {
            continue;
          }

          for (const stat of unit.stats.statList) {
            if (!unitSaveData.statLevels[stat]) {
              continue;
            }

            for (let i = unitSaveData.statLevels[stat]; i > 1; i--) {
              unit.stats.upgradeStat(stat, true);
            }
          }
        }
      }

      return true;
    } catch (error) {
      if (hardLoad) {
        this.snackbar.open(`Error loading save data: ${error}`, '', {duration: 5000});
        this.log('Error loading save data. Printing data to console for debugging.');
        this.importSave(backupSave, false);

        console.error(`Error loading save data:\n${error}\nPrinting save data to console for debugging.`);
        console.warn(saveDataString);
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
        const resource = this.game.resources.getResource(legacyResourceIds[resourceData.resourceId]);
        resourceData.sellsFor = resource.sellsFor;
      }
    }

    if (oldVersionIndex <= this.versionHistory.indexOf('Alpha 3')) {
      saveData.settings.resourceAnimationColors = {};
      saveData.settings.resourceAnimationColors[ResourceAnimationType.PlayerSpawned] = saveData.settings.harvestDetailColor;
      saveData.settings.resourceAnimationColors[ResourceAnimationType.WorkerSpawned] = saveData.settings.workerDetailColor;
      saveData.settings.resourceAnimationColors[ResourceAnimationType.Sold] = '#ffc089';

      saveData.tiles.map(tileData => {
        const isMarket = this.game.map.buildingTileData.get(tileData.buildingTileType).subType === BuildingSubType.Market;
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
        this.game.resources.getResource(resource.resourceEnum).resourceTier);
      saveData.settings.highestTierReached = accessedTiers.sort()[accessedTiers.length - 1];
    }

    if (oldVersionIndex <= this.versionHistory.indexOf('Alpha 3.4')) {
      saveData.tiles = [];
    }

    if (oldVersionIndex <= this.versionHistory.indexOf('Alpha 4.0')) {
      for (const enemySaveData of saveData.enemies) {
        enemySaveData.enemyType = EnemyType.Raider;
      }

      saveData.units = saveData.fighters;

      for (const unitSaveData of saveData.units) {
        unitSaveData.unitType = UnitType.Sentry;
      }
    }

    return saveData;
  }

  public get saveDataExists(): boolean {
    return localStorage.getItem('clickerGameSaveData') !== null;
  }

  private log(message: string) {
    console.log(message);
    this.game.messages.add(MessageSource.Settings, message);
  }
}
