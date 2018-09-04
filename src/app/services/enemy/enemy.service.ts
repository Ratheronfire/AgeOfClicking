import { Injectable } from '@angular/core';

import { timer } from 'rxjs';

import { ResourcesService } from '../resources/resources.service';
import { Enemy } from './../../objects/entity';
import { MapService } from '../map/map.service';
import { Tile, BuildingTileType } from '../../objects/tile';

declare var require: any;
const baseEnemyTypes = require('../../../assets/json/enemies.json');

@Injectable({
  providedIn: 'root'
})
export class EnemyService {
  public enemyTypes: Enemy[] = baseEnemyTypes;
  public enemies: Enemy[] = [];
  activePortalTile: Tile;

  constructor(protected resourcesService: ResourcesService,
              protected mapService: MapService) {
    this.openPortal(this.mapService.enemySpawnTiles[0]);

    const spawnSource = timer(5000, 5000);
    const spawnSubscribe = spawnSource.subscribe(_ => this.spawnEnemy());

    const processSource = timer(1000, 1000);
    const processSubscribe = processSource.subscribe(_ => this.processEnemies());
  }

  pickTarget(enemy: Enemy) {
    const sortedTargets = enemy.targets.sort((a, b) => {
      const aDist = Math.abs(a.x - enemy.x) + Math.abs(a.y - enemy.y);
      const bDist = Math.abs(b.x - enemy.x) + Math.abs(b.y - enemy.y);

      return aDist - bDist;
    });

    const targetIndex = enemy.targets.indexOf(sortedTargets[0]);

    enemy.pathStep = 0;
    enemy.pathingDone = false;

    enemy.targetIndex = targetIndex;
    enemy.currentTile = this.getTilePosition(enemy);
    this.snapToTile(enemy, enemy.currentTile);

    enemy.tilePath = this.mapService.findPath(enemy.currentTile, enemy.targets[targetIndex], false, true);
  }

  openPortal(tile: Tile) {
    if (this.activePortalTile) {
      this.activePortalTile.buildingTileType = undefined;
    }

    tile.buildingTileType = BuildingTileType.EnemyPortal;
    this.activePortalTile = tile;
  }

  getTilePosition(enemy: Enemy) {
    const x = Math.floor(enemy.x / 16) * 16;
    const y = Math.floor(enemy.y / 16) * 16;

    return this.mapService.tiledMap.filter(tile => tile.x === x && tile.y === y)[0];
  }

  snapToTile(enemy: Enemy, tile: Tile) {
    enemy.x = tile.x;
    enemy.y = tile.y;
  }

  spawnEnemy() {
    if (Math.random() > 0.2) {
      const spawnIndex = Math.floor(Math.random() *  this.mapService.enemySpawnTiles.length);
      this.openPortal(this.mapService.enemySpawnTiles[spawnIndex]);
    }

    const enemyIndex = Math.floor(Math.random() * this.enemyTypes.length);

    const spawnPoint = this.activePortalTile;
    const enemyType = this.enemyTypes[enemyIndex];

    const enemy: Enemy = {
      name: enemyType.name,
      x: spawnPoint.x,
      y: spawnPoint.y,
      currentTile: spawnPoint,
      tilePath: [],
      pathStep: 0,
      pathingDone: false,
      health: enemyType.health,
      maxHealth: enemyType.maxHealth,
      targetableBuildingTypes: enemyType.targetableBuildingTypes,
      targets: [],
      targetIndex: 0,
      attack: enemyType.attack,
      defense: enemyType.defense,
      resourcesToSteal: enemyType.resourcesToSteal,
      resourcesHeld: this.resourcesService.resources.map(resource => 0),
      totalHeld: 0,
      stealMax: enemyType.stealMax,
      resourceCapacity: enemyType.resourceCapacity
    };

    for (const buildingType of enemy.targetableBuildingTypes) {
      this.mapService.tiledMap.filter(tile => tile.buildingTileType === buildingType).map(tile => enemy.targets.push(tile));
    }

    this.pickTarget(enemy);

    this.enemies.push(enemy);
  }

  processEnemies() {
    for (const enemy of this.enemies) {
      const target = enemy.targets[enemy.targetIndex];

      if (target.buildingTileType === undefined) {
        this.finishTask(enemy);
      }

      if (enemy.pathingDone) {
        if (target.buildingTileType === BuildingTileType.Home) {
          for (const id of enemy.resourcesToSteal) {
            this.resourcesService.getResource(id).resourceBeingStolen = true;
          }

          if (enemy.totalHeld >= enemy.resourceCapacity) {
            for (const resource of this.resourcesService.resources) {
              resource.resourceBeingStolen = false;
            }

            this.finishTask(enemy);
          }

          const resourceIndex = Math.floor(Math.random() * enemy.resourcesToSteal.length);
          const resourceToSteal = this.resourcesService.getResource(enemy.resourcesToSteal[resourceIndex]);

          const amountToSteal = Math.random() * enemy.stealMax;
          enemy.resourcesHeld[resourceToSteal.id] += amountToSteal;
          enemy.totalHeld += amountToSteal;

          this.resourcesService.addResourceAmount(resourceToSteal.id, -amountToSteal);
          // console.log(`An enemy stole ${amountToSteal} ${resourceToSteal.name}!`);

          continue;
        }

        target.health -= enemy.attack;

        if (target.health <= 0) {
          this.mapService.clearBuilding(target);

          this.finishTask(enemy);
        }
      }
    }
  }

  finishTask(enemy) {
    enemy.targets = enemy.targets.filter(target => target !== enemy.targets[enemy.targetIndex]);

    if (enemy.targets) {
      this.pickTarget(enemy);
    }
  }
}
