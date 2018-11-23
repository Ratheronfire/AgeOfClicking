import { MapService } from 'src/app/services/map/map.service';
import { HealthBar } from '../healthbar';

export class Entity extends Phaser.GameObjects.PathFollower {
  name: string;

  spawnPosition: Phaser.Math.Vector2;
  currentTile: Phaser.Tilemaps.Tile;

  tilePath: Phaser.Tilemaps.Tile[];
  animationSpeed: number;

  health: number;
  maxHealth: number;
  healthBar: HealthBar;

  mapService: MapService;

  public constructor(x: number, y: number, health: number, animationSpeed: number,
                     scene: Phaser.Scene, texture: string, frame: string | number,
                     mapService: MapService, path?: Phaser.Curves.Path) {
    super(scene, path, x, y, texture, frame);

    this.mapService = mapService;

    this.name = name;

    this.spawnPosition = new Phaser.Math.Vector2(x, y);
    this.currentTile = this.mapService.mapLayer.getTileAtWorldXY(x, y);

    this.health = health;
    this.maxHealth = health;

    this.animationSpeed = animationSpeed;
  }

  get position(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.x, this.y);
  }

  destroy() {
    if (this.pathTween) {
      // Using the nuclear option to 100% ensure the entity & its tween are garbage collected.
      // This is probably excessive but if it works then I'm happy.
      this.stopFollow();
      this.pathTween.stop();
      this.scene.tweens.killTweensOf(this);
    }

    super.destroy();
  }
}
