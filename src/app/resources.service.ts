import { Injectable } from '@angular/core';

import { Resource } from './resource';
import { MessagesService } from './messages.service';

const baseResources: Resource[] = [
  { id: 0, name: 'gold', value: 0, harvestable: false, sellable: false },
  { id: 1, name: 'wood', value: 0, harvestable: true, harvestYield: 1, harvestMilliseconds: 1000, workerYield: 2, sellable: true, sellsFor: 5 },
  { id: 2, name: 'copper', value: 0, harvestable: false, harvestYield: 1, harvestMilliseconds: 1250, workerYield: 1, sellable: true, sellsFor: 7 },
  { id: 3, name: 'tin', value: 0, harvestable: false, harvestYield: 1, harvestMilliseconds: 1250, workerYield: 1, sellable: true, sellsFor: 7 },
  { id: 4, name: 'bronze ingot', value: 0, harvestable: false, harvestYield: 1, harvestMilliseconds: 1250, workerYield: 1, sellable: true, sellsFor: 7 },
  { id: 5, name: 'iron ore', value: 0, harvestable: false, workerYield: 1, sellable: true, sellsFor: 15 }
  { id: 6, name: 'iron ingot', value: 0, harvestable: false, workerYield: 1, sellable: true, sellsFor: 25 }
];

@Injectable({
  providedIn: 'root'
})
export class ResourcesService {
  public resources: Resource[] = baseResources;
  
  constructor(private messagesService: MessagesService) { }
  
  harvestResource(id: number) {
    if (!this.resources[id].harvestable)
      return;
    
    this.resources[id].value += this.resources[id].harvestYield;
  }
  
  public harvestableResources(): Resource[] {
    return this.resources.filter(resource => resource.harvestable);
  }
  
  public sellableResources(): Resource[] {
    return this.resources.filter(resource => resource.sellable);
  }
  
  private log(message: string) {
    this.messagesService.add(`ResourcesService: ${message}`);
  }
}
