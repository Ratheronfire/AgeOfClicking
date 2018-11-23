import { Entity } from './entity/entity';

export class HealthBar {
  owningObject: Entity | Phaser.Tilemaps.Tile;
  outerBar: Phaser.GameObjects.Rectangle;
  innerBar: Phaser.GameObjects.Rectangle;

  percentage: number;

  constructor(owningObject: Entity | Phaser.Tilemaps.Tile, scene: Phaser.Scene) {
    this.owningObject = owningObject;

    this.outerBar = scene.add.rectangle(owningObject.x, owningObject.y + owningObject.height / 2, owningObject.width, 8, 0xffffff);
    this.outerBar.strokeColor = 0x000000;
    this.outerBar.isStroked = true;

    this.innerBar = scene.add.rectangle(owningObject.x, owningObject.y + owningObject.height / 2, owningObject.width, 8, 0xff0000);

    this.updateHealthbar(1);
  }

  tick(elapsed: number, deltaTime: number, x: number, y: number) {
    this.outerBar.x = x;
    this.outerBar.y = y + this.owningObject.height / 2;
    this.innerBar.x = x;
    this.innerBar.y = y + this.owningObject.height / 2;
  }

  updateHealthbar(newPercentage: number) {
    this.percentage = newPercentage;

    this.outerBar.visible = this.percentage > 0 && this.percentage < 1;
    this.innerBar.visible = this.percentage > 0 && this.percentage < 1;

    this.innerBar.width = this.outerBar.width * this.percentage;
  }

  destroy() {
    this.outerBar.destroy();
    this.innerBar.destroy();
  }
}
