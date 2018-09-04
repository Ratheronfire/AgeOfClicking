import { Injectable } from '@angular/core';

import { timer } from 'rxjs';

import { Fighter } from '../../objects/entity';
import { Tile } from '../../objects/tile';
import { Resource } from './../../objects/resource';
import { MapTile } from './../../objects/tile';
import { ResourcesService } from '../resources/resources.service';
import { EnemyService } from './../enemy/enemy.service';
import { MapService } from '../map/map.service';

declare var require: any;
const baseFighterTypes = require('../../../assets/json/fighters.json');

@Injectable({
  providedIn: 'root'
})
export class FighterService {
  public fighterTypes: Fighter[] = baseFighterTypes;
  public fighters: Fighter[] = [];
  public selectedFighterType: Fighter = this.fighterTypes[0];

  constructor(protected resourcesService: ResourcesService,
              protected enemyService: EnemyService,
              protected mapService: MapService) {
    const processSource = timer(1000, 1000);
    const processSubscribe = processSource.subscribe(_ => this.processFighters());
  }

  processFighters() {
    const enemies = this.enemyService.enemies;
    const enemyMagnitudes = enemies.map(enemy => Math.sqrt(enemy.x ** 2 + enemy.y ** 2));

    for (const fighter of this.fighters) {
      const distance = Math.sqrt(fighter.x ** 2 + fighter.y ** 2);

      for (let i = 0; i < enemies.length; i++) {
        if (Math.abs(distance - enemyMagnitudes[i]) <= fighter.attackRange * this.mapService.tilePixelSize) {
          this.mapService.spawnProjectile(fighter, enemies[i]);
          break;
        }
      }
    }
  }

  createFighter(tile: Tile, fighterType: Fighter) {
    const goldResource: Resource = this.resourcesService.getResource(0);
    const mapTile: MapTile = this.mapService.mapTiles[tile.mapTileType];

    if (goldResource.amount < fighterType.cost || !mapTile.walkable) {
      return;
    }

    this.resourcesService.addResourceAmount(0, -fighterType.cost);

    const fighter: Fighter = {
      name: fighterType.name,
      x: tile.x,
      y: tile.y,
      currentTile: tile,
      tilePath: [],
      pathStep: 0,
      pathingDone: false,
      health: fighterType.health,
      maxHealth: fighterType.maxHealth,
      targetEnemy: undefined,
      cost: fighterType.cost,
      attack: fighterType.attack,
      defense: fighterType.defense,
      moveable: fighterType.moveable,
      attackRange: fighterType.attackRange
    };

    this.fighters.push(fighter);
  }
}
