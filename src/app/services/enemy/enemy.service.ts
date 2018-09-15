import { Injectable } from '@angular/core';

import { timer } from 'rxjs';

import { Enemy } from './../../objects/entity';
import { Vector } from '../../objects/vector';
import { MapService } from '../map/map.service';
import { Tile, BuildingTileType, MapTileType } from '../../objects/tile';
import { MessageSource } from '../../objects/message';
import { BuildingsService } from '../buildings/buildings.service';
import { ResourcesService } from '../resources/resources.service';
import { MessagesService } from '../messages/messages.service';
import { MapType } from '@angular/compiler';

declare var require: any;
const baseEnemyTypes = require('../../../assets/json/enemies.json');

@Injectable({
  providedIn: 'root'
})
export class EnemyService {
  public enemyTypes: Enemy[] = baseEnemyTypes;
  public enemies: Enemy[] = [];
  activePortalTile: Tile;

  minimumResourceAmount = 500;
  maxPathRetryCount = 25;
  maxEnemyCount = 25;

  enemiesActive: boolean;

  constructor(protected resourcesService: ResourcesService,
              protected buildingsService: BuildingsService,
              protected mapService: MapService,
              protected messagesService: MessagesService) {
    this.openPortal(this.mapService.enemySpawnTiles[0]);

    const spawnSource = timer(45000, 45000);
    const spawnSubscribe = spawnSource.subscribe(_ => this.spawnEnemy());

    const processSource = timer(1000, 1000);
    const processSubscribe = processSource.subscribe(_ => this.processEnemies());
  }

  pickTarget(enemy: Enemy) {
    const sortedTargets = enemy.targets.filter(target => target.accessible).sort((a, b) => {
      const aDist = Math.abs(a.tile.x - enemy.x) + Math.abs(a.tile.y - enemy.y);
      const bDist = Math.abs(b.tile.x - enemy.x) + Math.abs(b.tile.y - enemy.y);

      return aDist - bDist;
    });

    const accessibleTargets = enemy.targets.filter(target => target.accessible);
    const selectedTarget = accessibleTargets[Math.floor(Math.random() * accessibleTargets.length)];
    enemy.targetIndex = enemy.targets.indexOf(selectedTarget);

    enemy.pathStep = 0;
    enemy.pathingDone = false;

    enemy.currentTile = this.getTilePosition(enemy);

    if (enemy.targetIndex < 0) {
      enemy.targets = enemy.targets.filter(target => !target.wanderTarget);
      enemy.targets.push({tile: this.mapService.getRandomTile([MapTileType.Grass]), accessible: true, wanderTarget: true});
      enemy.targetIndex = enemy.targets.length - 1;
    }

    this.mapService.findPath(enemy.currentTile, enemy.targets[enemy.targetIndex].tile, false, true, 250).subscribe(tilePath => {
      enemy.tilePath = tilePath;

      if (!enemy.tilePath.length) {
        enemy.pathAttempt++;
        enemy.targets[enemy.targetIndex].accessible = false;

        if (enemy.pathAttempt >= this.maxPathRetryCount) {
          this.killEnemy(enemy);
        }

        this.finishTask(enemy);
      }
    });
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

  spawnEnemy() {
    if (Math.random() > 0.2) {
      const spawnIndex = Math.floor(Math.random() *  this.mapService.enemySpawnTiles.length);
      this.openPortal(this.mapService.enemySpawnTiles[spawnIndex]);
    }

    if (this.enemies.length >= this.maxEnemyCount || !this.enemiesActive) {
      return;
    }

    const enemyIndex = Math.floor(Math.random() * this.enemyTypes.length);

    const spawnPoint = this.activePortalTile;
    const enemyType = this.enemyTypes[enemyIndex];

    const enemy = new Enemy(enemyType.name, new Vector(spawnPoint.x, spawnPoint.y), spawnPoint, enemyType.health,
      enemyType.attack, enemyType.defense, enemyType.attackRange, enemyType.targetableBuildingTypes,
      enemyType.resourcesToSteal, enemyType.stealMax, enemyType.resourceCapacity);

    this.findTargets(enemy);
    this.pickTarget(enemy);

    this.log('An enemy has appeared!');

    this.enemies.push(enemy);
  }

  findTargets(enemy: Enemy) {
    for (const buildingType of enemy.targetableBuildingTypes) {
      for (const tile of this.mapService.tiledMap.filter(_tile => _tile.buildingTileType === buildingType)) {
        if (!enemy.targets.some(target => target.tile === tile)) {
          enemy.targets.push({tile: tile, accessible: true, wanderTarget: false});
        }
      }
    }

    if (enemy.targets[enemy.targetIndex].wanderTarget ||
      enemy.tilePath.some(tile => !tile.buildingTileType || !this.mapService.mapTiles[tile.mapTileType].walkable)) {
      this.finishTask(enemy);
    }
  }

  async recalculateTargets() {
    this.enemies.map(enemy => this.findTargets(enemy));
  }

  finishTask(enemy: Enemy) {
    enemy.targets[enemy.targetIndex].accessible = false;

    if (enemy.targets) {
      this.pickTarget(enemy);
    }
  }

  processEnemies() {
    for (const enemy of this.enemies) {
      const target = enemy.targets[enemy.targetIndex];

      if (target === undefined || ((!target.wanderTarget || enemy.pathingDone) && target.tile.buildingTileType === undefined)) {
        this.finishTask(enemy);

        continue;
      }

      if (enemy.pathingDone) {
        if (target.tile.buildingTileType === BuildingTileType.Home) {
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

          if (resourceToSteal.amount > this.minimumResourceAmount) {
            let amountToSteal = Math.floor(Math.random() * enemy.stealMax);
            if (resourceToSteal.amount - amountToSteal < this.minimumResourceAmount) {
              amountToSteal = resourceToSteal.amount - this.minimumResourceAmount;
            }

            if (enemy.resourcesHeld[resourceToSteal.id] === undefined) {
              enemy.resourcesHeld[resourceToSteal.id] = amountToSteal;
            } else {
              enemy.resourcesHeld[resourceToSteal.id] += amountToSteal;
            }

            if (amountToSteal > 0) {
              enemy.totalHeld += amountToSteal;

              this.resourcesService.addResourceAmount(resourceToSteal.id, -amountToSteal);
              this.log(`An enemy stole ${Math.floor(amountToSteal)} ${resourceToSteal.name}!`);
            }
          }
        } else {
          target.tile.health -= enemy.attack;
          if (target.tile.health < 0) {
            target.tile.health = 0;
          }

          if (target.tile.health <= 0) {
            this.mapService.calculateResourceConnections();

            this.finishTask(enemy);
          }
        }
      }
    }
  }

  killEnemy(enemy: Enemy) {
    let enemyDefeatedMessage = 'An enemy has been defeated!';

    if (enemy.totalHeld > 0) {
      enemyDefeatedMessage += ' Resources recovered:';

      for (let i = 0; i < enemy.resourcesHeld.length; i++) {
        const stolenAmount = enemy.resourcesHeld[i];
        if (isNaN(stolenAmount) || stolenAmount <= 0) {
          continue;
        }

        const resource = this.resourcesService.getResource(i);
        this.resourcesService.addResourceAmount(i, stolenAmount);

        enemyDefeatedMessage += ` ${Math.floor(stolenAmount)} ${resource.name},`;
      }

      enemyDefeatedMessage = enemyDefeatedMessage.slice(0, enemyDefeatedMessage.length - 1) + '.';
    }

    this.log(enemyDefeatedMessage);

    this.enemies = this.enemies.filter(_enemy => _enemy !== enemy);
  }

  resourceIsBeingStolen(id: number): boolean {
    const activeEnemies = this.enemies.filter(
      enemy => enemy.pathingDone && enemy.targets.length &&
        enemy.targets[enemy.targetIndex].tile.buildingTileType === BuildingTileType.Home);

    return activeEnemies.some(enemy => enemy.resourcesToSteal.includes(id));
  }

  private log(message: string) {
    this.messagesService.add(MessageSource.Enemy, message);
  }
}
