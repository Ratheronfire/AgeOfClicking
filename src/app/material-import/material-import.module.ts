import { NgModule } from '@angular/core';

import { MatButtonModule, MatCheckboxModule } from '@angular/material';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';

@NgModule({
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatGridListModule,
    MatTabsModule,
    MatExpansionModule,
    MatDividerModule
  ],
  exports: [
    MatButtonModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatGridListModule,
    MatTabsModule,
    MatExpansionModule,
    MatDividerModule
  ]
})
export class MaterialImportModule { }
