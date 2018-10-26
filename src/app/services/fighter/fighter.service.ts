import { Injectable } from '@angular/core';

import { Fighter } from '../../objects/entity';
import { Tile } from '../../objects/tile';
import { Resource } from './../../objects/resource';
import { ResourceEnum } from './../../objects/resourceData';
import { MapTileData } from './../../objects/tile';
import { Vector } from '../../objects/vector';
import { ResourcesService } from '../resources/resources.service';
import { EnemyService } from './../enemy/enemy.service';
import { MapService } from '../map/map.service';
import { Tick } from '../tick/tick.service';

declare var require: any;
const baseFighterTypes = require('../../../assets/json/fighters.json');

@Injectable({
  providedIn: 'root'
})
export class FighterService implements Tick {
  public fighterTypes: Fighter[] = baseFighterTypes;
  public fighters: Fighter[] = [];
  public selectedFighterType: Fighter;

  constructor(protected resourcesService: ResourcesService,
              protected enemyService: EnemyService,
              protected mapService: MapService) {
  }

  tick(elapsed: number, deltaTime: number) {
    this.fighters.map(fighter => fighter.tick(elapsed, deltaTime));

    this.fighters = this.fighters.filter(fighter => fighter.health > 0);
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
    const goldResource: Resource = this.resourcesService.resources.get(ResourceEnum.Gold);
    const mapTile: MapTileData = this.mapService.mapTileData.get(tile.mapTileType);
    const overlaps = this.fighters.filter(_fighter => !_fighter.moveable && _fighter.currentTile === tile);

    if (goldResource.amount < fighterType.cost || !mapTile.walkable || overlaps.length) {
      return;
    }

    this.resourcesService.resources.get(ResourceEnum.Gold).addAmount(-fighterType.cost);

    const fighter = new Fighter(fighterType.name, new Vector(tile.x, tile.y), tile, fighterType.health, 0.003, fighterType.attack,
      fighterType.defense, fighterType.attackRange, fighterType.description, fighterType.cost, fighterType.moveable, 1000,
      this.resourcesService, this.enemyService, this.mapService);

    this.fighters.push(fighter);
  }
}
