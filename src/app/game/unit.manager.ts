import { GameService } from './game.service';
import { UnitType, Unit } from '../objects/entity/unit/unit';
import { Resource } from '../objects/resource';
import { ResourceEnum } from '../objects/resourceData';

declare var require: any;
const baseUnitData = require('../../assets/json/units.json');

export class UnitManager {
  public unitsData: {} = baseUnitData;
  unitGroup: Phaser.GameObjects.Group;
  public selectedUnitType: UnitType;

  private game: GameService;

  constructor(game: GameService) {
    this.game = game;
  }

  canAffordUnit(unitType: UnitType) {
    const goldResource: Resource = this.game.resources.getResource(ResourceEnum.Gold);
    const unitData = this.unitsData[unitType];

    return goldResource.amount >= unitData.cost;
  }

  purchaseUnit(unitType: UnitType) {
    const unitData = this.unitsData[unitType];

    if (!this.canAffordUnit(unitType)) {
      return;
    }

    this.game.resources.getResource(ResourceEnum.Gold).addAmount(-unitData.cost);
  }

  get units(): Unit[] {
    return this.unitGroup ? this.unitGroup.getChildren().map(unit => unit as Unit) : [];
  }
}
