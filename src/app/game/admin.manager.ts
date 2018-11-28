import { GameService } from './game.service';

export class AdminManager {
  public filterAccessible = true;
  public editMode = false;

  private game: GameService;

  constructor(game: GameService) {
    this.game = game;
  }
}
