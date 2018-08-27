import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import * as ClipboardJS from 'clipboard';

@Component({
  selector: 'app-save-dialog',
  templateUrl: './save-dialog.component.html',
  styleUrls: ['./save-dialog.component.css']
})
export class SaveDialogComponent implements OnInit {
  saveData: string;
  exportMode = false;
  clipboard;

  constructor(public dialogRef: MatDialogRef<SaveDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    if (this.data.saveData !== undefined) {
      this.saveData = this.data.saveData;
      this.exportMode = true;

      this.clipboard = new ClipboardJS('.copy-button');
    }
  }

  exportData() {
    this.dialogRef.close(this.saveData);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
