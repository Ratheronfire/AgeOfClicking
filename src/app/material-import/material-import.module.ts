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
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatSliderModule } from '@angular/material/slider';
import { MatDialogModule } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

const modules = [
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
  MatDividerModule,
  MatInputModule,
  MatSelectModule,
  MatListModule,
  MatSliderModule,
  MatDialogModule,
  MatStepperModule,
  MatSnackBarModule,
  MatBadgeModule,
  MatButtonToggleModule
];

@NgModule({
  imports: modules,
  exports: modules
})
export class MaterialImportModule { }
