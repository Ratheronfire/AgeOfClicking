import { Component, OnInit } from '@angular/core';
import { ResourcesService } from 'src/app/resources.service';

@Component({
  selector: 'app-admin-debug',
  templateUrl: './admin-debug.component.html',
  styleUrls: ['./admin-debug.component.css']
})
export class AdminDebugComponent implements OnInit {

  constructor(private resourcesService: ResourcesService) { }

  ngOnInit() {
  }

}
