import { Injectable } from '@angular/core';

import { Fighter, FighterData } from '../../objects/entity';
import { Resource } from './../../objects/resource';
import { ResourceEnum } from './../../objects/resourceData';
import { ResourcesService } from '../resources/resources.service';
import { EnemyService } from './../enemy/enemy.service';
import { Tick } from '../tick/tick.service';

declare var require: any;
const baseFighterTypes = require('../../../assets/json/fighters.json');

@Injectable({
  providedIn: 'root'
})
export class FighterService implements Tick {
  public fighterTypes: FighterData[] = baseFighterTypes;
  public fighters: Fighter[] = [];
  public selectedFighterType: FighterData;

  constructor(protected resourcesService: ResourcesService,
              protected enemyService: EnemyService) {
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

  canAffordFighter(fighterType: FighterData) {
    const goldResource: Resource = this.resourcesService.resources.get(ResourceEnum.Gold);
    return goldResource.amount >= fighterType.cost;
  }

  purchaseFigher(fighterType: FighterData) {
    if (!this.canAffordFighter(fighterType)) {
      return;
    }

    this.resourcesService.resources.get(ResourceEnum.Gold).addAmount(-fighterType.cost);
  }
}
