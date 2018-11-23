import { MapService } from './../../services/map/map.service';
import { Actor } from './actor';
import { Entity } from './entity';

export class Projectile extends Entity {
  owner: Actor;
  target: Actor;

  rotation: number;

  hitTarget = false;

  timeSinceSpawn = 0;
  lifeSpan = 5000;

  public constructor(x: number, y: number, animationSpeed: number, owner: Actor, target: Actor,
      scene: Phaser.Scene, texture: string, frame: string | number, mapService: MapService) {
    super(x, y, 1, animationSpeed, scene, texture, frame, mapService);

    this.owner = owner;
    this.target = target;
  }

  tick(elapsed: number, deltaTime: number) {
    this.timeSinceSpawn += deltaTime;
    if (this.timeSinceSpawn > this.lifeSpan || !this.target || !this.target.active || !this.target.health) {
      this.destroy();
    }
  }

  fireProjectile() {
    const gradientY = this.target.y - this.y;
    const gradientX = this.target.x - this.x;
    const angleToTarget = Math.atan2(gradientY, gradientX) + (Math.PI / 2);

    const physicsBody = this.body as Phaser.Physics.Matter.Sprite;
    this.angle = Phaser.Math.RAD_TO_DEG * angleToTarget;
    physicsBody.setVelocity(gradientX * this.animationSpeed, gradientY * this.animationSpeed);
  }
}
