import { Injectable } from '@angular/core';

import { Resource } from '../../objects/resource';
import { Enemy, EnemyData, EnemyState } from './../../objects/entity';
import { MessageSource } from '../../objects/message';
import { BuildingsService } from '../buildings/buildings.service';
import { ResourcesService } from '../resources/resources.service';
import { MessagesService } from '../messages/messages.service';

declare var require: any;
const baseEnemyTypes = require('../../../assets/json/enemies.json');

@Injectable({
  providedIn: 'root'
})
export class EnemyService {
  public enemyTypes: EnemyData[] = baseEnemyTypes;
  enemyGroup: Phaser.GameObjects.Group;

  enemiesActive: boolean;

  constructor(protected resourcesService: ResourcesService,
              protected buildingsService: BuildingsService,
              protected messagesService: MessagesService) { }

  resourceIsBeingStolen(resource: Resource): boolean {
    const activeEnemies = this.enemies.filter(
      enemy => enemy.currentState === EnemyState.Looting);

    return activeEnemies.some(enemy => enemy.resourcesToSteal.includes(resource.resourceEnum));
  }

  private log(message: string) {
    this.messagesService.add(MessageSource.Enemy, message);
  }

  get enemies(): Enemy[] {
    return this.enemyGroup ? this.enemyGroup.getChildren().map(enemy => enemy as Enemy) : [];
  }
}
