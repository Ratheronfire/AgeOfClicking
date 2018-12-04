import { Component, OnInit } from '@angular/core';
import { Resource } from '../../objects/resource';
import { ResourceEnum, ResourceType } from '../../objects/resourceData';
import { Worker } from '../../objects/worker';
import { GameService } from './../../game/game.service';


@Component({
  selector: 'app-workers',
  templateUrl: './workers.component.html',
  styleUrls: ['./workers.component.css']
})
export class WorkersComponent implements OnInit {
  constructor(protected game: GameService) { }

  ngOnInit() {
  }

  getWorkers(filterByAccessible: boolean, filterByWorkable: boolean, filterByHarvestable: boolean): Worker[] {
    return this.game.workers.getWorkers(filterByAccessible, filterByWorkable, filterByHarvestable);
  }

  public getWorker(resourceType: ResourceType) {
    return this.game.workers.workers.get(resourceType);
  }

  getResource(resourceEnum: ResourceEnum): Resource {
    return this.game.resources.getResource(resourceEnum);
  }

  getAccessibleResourceWorkers(worker: Worker) {
    return worker.getResourceWorkers(true);
  }

  canAffordToHarvest(resourceEnum: ResourceEnum): boolean {
    return this.game.workers.getWorkerFromResource(resourceEnum).canAffordToHarvest(resourceEnum);
  }

  canHarvest(resourceEnum: ResourceEnum): boolean {
    return this.game.resources.getResource(resourceEnum).canHarvest() && this.canAffordToHarvest(resourceEnum);
  }

  shouldShowResource(resourceEnum: ResourceEnum): boolean {
    const resource = this.game.resources.getResource(resourceEnum);
    const resourceWorker = this.game.workers.getResourceWorker(resourceEnum);

    return (resourceWorker.workable && resource.harvestable) || !this.game.admin.filterAccessible;
  }

  getTooltipMessage(resourceEnum: ResourceEnum): string {
    return this.game.tooltip.getWorkerTooltip(resourceEnum);
  }

  checkSliderValue(eventOrEnum: any | string) {
    const resourceEnum = typeof(eventOrEnum) === 'string' ? eventOrEnum : eventOrEnum.source._elementRef.nativeElement.id;

    const resource = this.game.resources.getResource(resourceEnum);
    const worker = this.getWorker(resource.resourceType);
    const resourceWorker = this.game.workers.getResourceWorker(resourceEnum);

    const newValue = typeof(eventOrEnum) === 'string' ? resourceWorker.sliderSetting : +eventOrEnum.value;

    resourceWorker.sliderSettingValid = worker.freeWorkers + resourceWorker.workerCount - newValue >= 0;
  }

  updateResourceWorker(eventOrEnum: any | string, value = -1) {
    const resourceEnum = typeof(eventOrEnum) === 'string' ? eventOrEnum : eventOrEnum.source._elementRef.nativeElement.id;
    if (value === -1) {
      value = +eventOrEnum.value;
    }

    this.game.workers.getWorkerFromResource(resourceEnum).updateResourceWorker(resourceEnum, value);
  }

  pathAvailable(resourceEnum: ResourceEnum): boolean {
    return this.game.resources.getResource(resourceEnum).pathAvailable;
  }

  get workersPaused(): boolean {
    return this.game.workers.workersPaused;
  }

  set workersPaused(value: boolean) {
    this.game.workers.workersPaused = value;
  }

  get foodStockpile(): number {
    return this.game.workers.foodStockpile;
  }

  get foodCapacity(): number {
    return this.game.workers.foodCapacity;
  }

  get foodPercentage(): number {
    return Math.floor(this.game.workers.foodStockpile / this.game.workers.foodCapacity * 100);
  }
}
