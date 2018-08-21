import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';

import { ResourceDialogComponent } from './resource-dialog/resource-dialog.component';
import { UpgradeDialogComponent } from './upgrade-dialog/upgrade-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  public filterAccessible = true;
  public clampMap = true;
  public editMode: false;

  constructor(public dialog: MatDialog) { }

  openResourceDialog(resourceId?: number) {
    const dialogRef = this.dialog.open(ResourceDialogComponent, {
      width: '750px',
      height: '600px',
      data: resourceId === undefined ? {} : {resourceId: resourceId}
    });

    dialogRef.afterClosed().subscribe(result => {
    });
  }

  openUpgradeDialog(upgradeId?: number) {
    const dialogRef = this.dialog.open(UpgradeDialogComponent, {
      width: '750px',
      height: '525px',
      data: upgradeId === undefined ? {} : {upgradeId: upgradeId}
    });

    dialogRef.afterClosed().subscribe(result => {
    });
  }
}
