import { Component, OnInit } from '@angular/core';

import { AdminService } from './../admin.service';
import { ResourcesService } from 'src/app/resources.service';

@Component({
  selector: 'app-admin-debug',
  templateUrl: './admin-debug.component.html',
  styleUrls: ['./admin-debug.component.css']
})
export class AdminDebugComponent implements OnInit {
  public filterAccessible = true;

  constructor(protected resourcesService: ResourcesService,
              protected adminService: AdminService) { }

  ngOnInit() {
  }

}
