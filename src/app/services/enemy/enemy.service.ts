import { Injectable } from '@angular/core';
import { ActorState } from 'src/app/objects/entity/actor';
import { Enemy, EnemyType } from 'src/app/objects/entity/enemy/enemy';
import { MessageSource } from '../../objects/message';
import { Resource } from '../../objects/resource';
import { BuildingsService } from '../buildings/buildings.service';
import { MessagesService } from '../messages/messages.service';
import { ResourcesService } from '../resources/resources.service';
import { Raider } from 'src/app/objects/entity/enemy/raider';


declare var require: any;
const baseEnemyTypes = require('../../../assets/json/enemies.json');

@Injectable({
  providedIn: 'root'
})
export class EnemyService {
  public enemiesData: {} = baseEnemyTypes;
  enemyGroup: Phaser.GameObjects.Group;

  enemiesActive: boolean;

  constructor(protected resourcesService: ResourcesService,
              protected buildingsService: BuildingsService,
              protected messagesService: MessagesService) { }

  resourceIsBeingStolen(resource: Resource): boolean {
    const activeEnemies = this.enemies.filter(
      enemy => enemy.enemyType === EnemyType.Raider && enemy.currentState === ActorState.Looting);

    return activeEnemies.some(enemy => (enemy as Raider).resourcesToSteal.includes(resource.resourceEnum));
  }

  private log(message: string) {
    this.messagesService.add(MessageSource.Enemy, message);
  }

  get enemies(): Enemy[] {
    return this.enemyGroup ? this.enemyGroup.getChildren().map(enemy => enemy as Enemy) : [];
  }
}
