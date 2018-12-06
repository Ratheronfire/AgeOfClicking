import { Enemy, EnemyType } from '../objects/entity/enemy/enemy';
import { Raider } from '../objects/entity/enemy/raider';
import { EntityState } from '../objects/entity/entity';
import { MessageSource } from '../objects/message';
import { Resource } from '../objects/resource';
import { GameService } from './game.service';

declare var require: any;
const baseEnemyTypes = require('../../assets/json/enemies.json');

export class EnemyManager {
  public enemiesData: {} = baseEnemyTypes;
  enemyGroup: Phaser.GameObjects.Group;

  enemiesActive: boolean;

  private game: GameService;

  constructor(game: GameService) {
    this.game = game;
  }

  resourceIsBeingStolen(resource: Resource): boolean {
    const activeEnemies = this.enemies.filter(
      enemy => enemy.enemyType === EnemyType.Raider && enemy.currentState === EntityState.Looting);

    return activeEnemies.some(enemy => (enemy as Raider).resourcesToSteal.includes(resource.resourceEnum));
  }

  private log(message: string) {
    this.game.messages.add(MessageSource.Enemy, message);
  }

  get enemies(): Enemy[] {
    return this.enemyGroup ? this.enemyGroup.getChildren().map(enemy => enemy as Enemy) : [];
  }
}
