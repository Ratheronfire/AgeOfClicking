import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ZoomableCanvasComponent } from '@durwella/zoomable-canvas';

import { MaterialImportModule } from './material-import/material-import.module';
import { PhaserModule } from 'phaser-component-library';
import { PipeModule } from './pipes/pipe.module';
import { ColorPickerModule } from 'ngx-color-picker';
import { TippyModule } from 'ng-tippy';

import { AppComponent } from './app.component';
import { HarvestComponent } from './components/harvest/harvest.component';
import { MessagesComponent } from './components/messages/messages.component';
import { StoreComponent } from './components/store/store.component';
import { UpgradesComponent } from './components/upgrades/upgrades.component';
import { MapComponent } from './components/map/map.component';
import { SettingsComponent } from './components/settings/settings.component';
import { AdminDebugComponent } from './components/admin-debug/admin-debug.component';
import { AboutDialogComponent } from './components/about-dialog/about-dialog.component';
import { SaveDialogComponent } from './components/save-dialog/save-dialog.component';
import { EnemyComponent } from './components/enemy/enemy.component';
import { UnitDropdownComponent } from './components/unit-dropdown/unit-dropdown.component';
import { BuildingDropdownComponent } from './components/building-dropdown/building-dropdown.component';
import { TileDetailComponent } from './components/tile-detail/tile-detail.component';
import { UnitDetailComponent } from './components/unit-detail/unit-detail.component';
import { UnitsComponent } from './components/units/units.component';
import { TasksComponent } from './components/tasks/tasks.component';

@NgModule({
  declarations: [
    AppComponent,
    ZoomableCanvasComponent,
    HarvestComponent,
    MessagesComponent,
    StoreComponent,
    UpgradesComponent,
    SettingsComponent,
    AdminDebugComponent,
    MapComponent,
    SaveDialogComponent,
    EnemyComponent,
    UnitDropdownComponent,
    BuildingDropdownComponent,
    TileDetailComponent,
    UnitDetailComponent,
    AboutDialogComponent,
    UnitsComponent,
    TasksComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MaterialImportModule,
    PhaserModule,
    PipeModule,
    ColorPickerModule,
    TippyModule
  ],
  entryComponents: [
    AboutDialogComponent,
    SaveDialogComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
