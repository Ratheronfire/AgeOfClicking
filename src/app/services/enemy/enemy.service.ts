import { Injectable, AfterViewInit } from '@angular/core';

import { timer } from 'rxjs';

import { Resource } from '../../objects/resource';
import { Enemy } from './../../objects/entity';
import { Vector } from '../../objects/vector';
import { MapService } from '../map/map.service';
import { Tile, BuildingTileType, MapTileType } from '../../objects/tile';
import { MessageSource } from '../../objects/message';
import { BuildingsService } from '../buildings/buildings.service';
import { ResourcesService } from '../resources/resources.service';
import { MessagesService } from '../messages/messages.service';
import { Tick } from '../tick/tick.service';

declare var require: any;
const baseEnemyTypes = require('../../../assets/json/enemies.json');

@Injectable({
  providedIn: 'root'
})
export class EnemyService implements Tick, AfterViewInit {
  public enemyTypes: Enemy[] = baseEnemyTypes;
  public enemies: Enemy[] = [];
  activePortalTile: Tile;

  spawnInterval = 45000;
  lastSpawnTime = 0;
  processInterval = 1000;
  lastProcessTime = 0;

  minimumResourceAmount = 500;
  maxPathRetryCount = 25;
  maxEnemyCount = 25;

  enemiesActive: boolean;

  constructor(protected resourcesService: ResourcesService,
              protected buildingsService: BuildingsService,
              protected mapService: MapService,
              protected messagesService: MessagesService) { }

  ngAfterViewInit() {
    this.openPortal();
  }

  tick(elapsed: number, deltaTime: number) {
    if (elapsed - this.lastSpawnTime >= this.spawnInterval) {
      this.spawnEnemy();
      this.lastSpawnTime = elapsed;
    }

    if (elapsed - this.lastProcessTime >= this.processInterval) {
      this.processEnemies();
      this.lastProcessTime = elapsed;
    }

    for (const enemy of this.enemies) {
      enemy.updatePathPosition(deltaTime);

      if (enemy.health <= 0) {
        this.killEnemy(enemy);
      }
    }
  }

  pickTarget(enemy: Enemy) {
    const sortedTargets = enemy.targets.filter(target => target.accessible).sort((a, b) => {
      const aDist = Math.abs(a.tile.x - enemy.x) + Math.abs(a.tile.y - enemy.y);
      const bDist = Math.abs(b.tile.x - enemy.x) + Math.abs(b.tile.y - enemy.y);

      return aDist - bDist;
    });

    enemy.targetIndex = enemy.targets.indexOf(sortedTargets[0]);

    enemy.pathStep = 0;
    enemy.pathingDone = false;

    enemy.currentTile = this.getTilePosition(enemy);

    if (enemy.targetIndex < 0) {
      enemy.targets = enemy.targets.filter(target => !target.wanderTarget);
      enemy.targets.push({tile: this.mapService.getRandomTile([MapTileType.Grass]), accessible: true, wanderTarget: true});
      enemy.targetIndex = enemy.targets.length - 1;
    }

    this.mapService.findPath(enemy.currentTile, enemy.targets[enemy.targetIndex].tile, false, true).subscribe(tilePath => {
      enemy.tilePath = tilePath;

      if (!enemy.tilePath.length) {
        enemy.pathAttempt++;
        enemy.targets[enemy.targetIndex].accessible = false;

        if (enemy.pathAttempt >= this.maxPathRetryCount) {
          this.killEnemy(enemy, true);
        }

        this.finishTask(enemy);
      }
    });
  }

  openPortal() {
    for (const existingTile of this.mapService.tileMap.filter(_tile => _tile.buildingTileType === BuildingTileType.EnemyPortal)) {
      existingTile.buildingTileType = undefined;
    }

    const tile = this.mapService.getRandomTile([MapTileType.Grass]);

    tile.buildingTileType = BuildingTileType.EnemyPortal;
    this.activePortalTile = tile;
  }

  getTilePosition(enemy: Enemy) {
    const x = Math.floor(enemy.x / this.mapService.tilePixelSize);
    const y = Math.floor(enemy.y / this.mapService.tilePixelSize);

    return this.mapService.getTile(x, y);
  }

  spawnEnemy() {
    if (Math.random() > 0.2) {
      this.openPortal();
    }

    if (this.enemies.length >= this.maxEnemyCount || !this.enemiesActive) {
      return;
    }

    const enemyIndex = Math.floor(Math.random() * this.enemyTypes.length);

    const spawnPoint = this.activePortalTile;
    const enemyType = this.enemyTypes[enemyIndex];

    const cappedScore = Math.min(3000, this.resourcesService.playerScore / 50000);
    const difficultyModifier = Math.max(1, Math.random() * cappedScore);

    const animationSpeed = Math.min(0.008, 0.003 + difficultyModifier / 10000);

    const enemy = new Enemy(enemyType.name, new Vector(spawnPoint.x, spawnPoint.y), spawnPoint, enemyType.health * difficultyModifier,
      animationSpeed, enemyType.attack * difficultyModifier, enemyType.defense * difficultyModifier,
      enemyType.attackRange, enemyType.targetableBuildingTypes, enemyType.resourcesToSteal,
      enemyType.stealMax * difficultyModifier, enemyType.resourceCapacity * difficultyModifier);

    this.findTargets(enemy);
    this.pickTarget(enemy);

    this.log('An enemy has appeared!');

    this.enemies.push(enemy);
  }

  findTargets(enemy: Enemy) {
    for (const buildingType of enemy.targetableBuildingTypes) {
      for (const tile of this.mapService.tileMap.filter(_tile => _tile.buildingTileType === buildingType)) {
        if (!enemy.targets.some(target => target.tile === tile)) {
          enemy.targets.push({tile: tile, accessible: true, wanderTarget: false});
        }
      }
    }

    if (enemy.targets[enemy.targetIndex].wanderTarget ||
      enemy.tilePath.some(tile => !tile.buildingTileType || !this.mapService.mapTiles.get(tile.mapTileType).walkable)) {
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
          for (const resourceEnum of enemy.resourcesToSteal) {
            this.resourcesService.resources.get(resourceEnum).resourceBeingStolen = true;
          }

          if (enemy.totalHeld >= enemy.resourceCapacity) {
            for (const resource of this.resourcesService.getResources()) {
              resource.resourceBeingStolen = false;
            }

            this.finishTask(enemy);
          }

          const resourceIndex = Math.floor(Math.random() * enemy.resourcesToSteal.length);
          const resourceToSteal = this.resourcesService.resources.get(enemy.resourcesToSteal[resourceIndex]);

          if (resourceToSteal.amount > this.minimumResourceAmount) {
            let amountToSteal = Math.floor(Math.random() * enemy.stealMax);
            if (resourceToSteal.amount - amountToSteal < this.minimumResourceAmount) {
              amountToSteal = resourceToSteal.amount - this.minimumResourceAmount;
            }

            if (!enemy.resourcesHeld.get(resourceToSteal.resourceEnum)) {
              enemy.resourcesHeld.set(resourceToSteal.resourceEnum, amountToSteal);
            } else {
              enemy.resourcesHeld.set(resourceToSteal.resourceEnum, enemy.resourcesHeld.get(resourceToSteal.resourceEnum) + amountToSteal);
            }

            if (amountToSteal > 0) {
              enemy.totalHeld += amountToSteal;

              resourceToSteal.addAmount(-amountToSteal);
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

  killEnemy(enemy: Enemy, killSilently = false) {
    let enemyDefeatedMessage = 'An enemy has been defeated!';

    if (enemy.totalHeld > 0) {
      enemyDefeatedMessage += ' Resources recovered:';

      for (const resourceEnum of enemy.resourcesToSteal) {
        const stolenAmount = enemy.resourcesHeld.get(resourceEnum);
        if (isNaN(stolenAmount) || stolenAmount <= 0) {
          continue;
        }

        const resource = this.resourcesService.resources.get(resourceEnum);
        resource.addAmount(stolenAmount);

        enemyDefeatedMessage += ` ${Math.floor(stolenAmount)} ${resource.name},`;
      }

      enemyDefeatedMessage = enemyDefeatedMessage.slice(0, enemyDefeatedMessage.length - 1) + '.';
    }

    if (!killSilently) {
      this.log(enemyDefeatedMessage);
    }

    this.enemies = this.enemies.filter(_enemy => _enemy !== enemy);
  }

  resourceIsBeingStolen(resource: Resource): boolean {
    const activeEnemies = this.enemies.filter(
      enemy => enemy.pathingDone && enemy.targets.length &&
        enemy.targets[enemy.targetIndex].tile.buildingTileType === BuildingTileType.Home);

    return activeEnemies.some(enemy => enemy.resourcesToSteal.includes(resource.resourceEnum));
  }

  private log(message: string) {
    this.messagesService.add(MessageSource.Enemy, message);
  }
}
