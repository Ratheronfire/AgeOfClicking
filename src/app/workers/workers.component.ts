import { Component, OnInit } from '@angular/core';

import { timer } from 'rxjs';

import { Worker } from '../worker';
import { WorkersService } from '../workers.service';
import { Resource } from '../resource';
import { ResourcesService } from '../resources.service';

@Component({
  selector: 'app-workers',
  templateUrl: './workers.component.html',
  styleUrls: ['./workers.component.css']
})
export class WorkersComponent implements OnInit {
  constructor(private workersService: WorkersService,
              private resourcesService: ResourcesService) { }

  ngOnInit() {
  }
  
  hireWorker(id: number) {
    this.workersService.hireWorker(id);
  }
}
