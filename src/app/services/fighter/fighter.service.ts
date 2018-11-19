import { Injectable } from '@angular/core';

import { Fighter, FighterData } from '../../objects/entity';
import { Resource } from './../../objects/resource';
import { ResourceEnum } from './../../objects/resourceData';
import { ResourcesService } from '../resources/resources.service';
import { EnemyService } from './../enemy/enemy.service';

declare var require: any;
const baseFighterTypes = require('../../../assets/json/fighters.json');

@Injectable({
  providedIn: 'root'
})
export class FighterService {
  public fighterTypes: FighterData[] = baseFighterTypes;
  fighterGroup: Phaser.GameObjects.Group;
  public selectedFighterType: FighterData;

  constructor(protected resourcesService: ResourcesService,
              protected enemyService: EnemyService) {
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

  get fighters(): Fighter[] {
    return this.fighterGroup.getChildren().map(fighter => fighter as Fighter);
  }
}
