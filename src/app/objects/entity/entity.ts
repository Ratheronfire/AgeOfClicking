import { HealthBar } from '../healthbar';
import { GameService } from './../../game/game.service';

export class Entity extends Phaser.GameObjects.PathFollower {
  spawnPosition: Phaser.Math.Vector2;
  currentTile: Phaser.Tilemaps.Tile;

  tilePath: Phaser.Tilemaps.Tile[];
  animationSpeed: number;

  health: number;
  maxHealth: number;
  healthBar: HealthBar;

  protected game: GameService;

  public constructor(x: number, y: number, health: number, animationSpeed: number,
                     scene: Phaser.Scene, texture: string, frame: string | number,
                     game: GameService, path?: Phaser.Curves.Path) {
    super(scene, path, x, y, texture, frame);

    this.game = game;

    this.name = name;

    this.spawnPosition = new Phaser.Math.Vector2(x, y);
    this.currentTile = this.game.map.mapLayer.getTileAtWorldXY(x, y);

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
