import { Component, OnInit } from '@angular/core';

import { AdminService } from '../../services/admin/admin.service';
import { ResourcesService } from '../../services/resources/resources.service';
import { Resource } from '../../objects/resource';
import { Worker } from '../../objects/worker';
import { WorkersService } from '../../services/workers/workers.service';
import { UpgradesService } from '../../services/upgrades/upgrades.service';

@Component({
  selector: 'app-admin-debug',
  templateUrl: './admin-debug.component.html',
  styleUrls: ['./admin-debug.component.css']
})
export class AdminDebugComponent implements OnInit {
  public filterAccessible = true;

  public selectedResource: Resource;
  amount = 0;

  constructor(public resourcesService: ResourcesService,
              public adminService: AdminService
  ) {}

  ngOnInit() {}

  addResourceAmount(selectedResource?: Resource) {
    if (!selectedResource) {
      for (const resource of this.resourcesService.getResources()) {
        resource.addAmount(+this.amount);
      }

      return;
    }

    selectedResource.addAmount(+this.amount);
  }
}
