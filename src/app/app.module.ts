import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ZoomableCanvasComponent } from '@durwella/zoomable-canvas';

import { MaterialImportModule } from './material-import/material-import.module';
import { PipeModule } from './pipes/pipe.module';
import { LongNumberPipe } from './pipes/long-number-pipe';
import { ColorPickerModule } from 'ngx-color-picker';

import { AppComponent } from './app.component';
import { ClickerMainComponent } from './components/clicker-main/clicker-main.component';
import { MessagesComponent } from './components/messages/messages.component';
import { WorkersComponent } from './components/workers/workers.component';
import { StoreComponent } from './components/store/store.component';
import { UpgradesComponent } from './components/upgrades/upgrades.component';
import { MapComponent } from './components/map/map.component';
import { SettingsComponent } from './components/settings/settings.component';
import { AdminDebugComponent } from './components/admin-debug/admin-debug.component';
import { SaveDialogComponent } from './components/save-dialog/save-dialog.component';
import { CropDirective } from './directives/crop/crop.directive';
import { MapDirective } from './directives/map/map.directive';
import { NoScrollDirective } from './directives/no-scroll/no-scroll.directive';
import { EnemyComponent } from './components/enemy/enemy.component';
import { FighterComponent } from './components/fighter/fighter.component';
import { BuildingsComponent } from './components/buildings/buildings/buildings.component';
import { TileDetailComponent } from './components/tile-detail/tile-detail.component';
import { FighterDetailComponent } from './components/fighter-detail/fighter-detail.component';
import { SnapDirective } from './directives/snap/snap.directive';
import { MinimapDirective } from './directives/minimap/minimap.directive';

@NgModule({
  declarations: [
    AppComponent,
    ZoomableCanvasComponent,
    ClickerMainComponent,
    MessagesComponent,
    WorkersComponent,
    StoreComponent,
    UpgradesComponent,
    SettingsComponent,
    AdminDebugComponent,
    MapComponent,
    CropDirective,
    SaveDialogComponent,
    MapDirective,
    NoScrollDirective,
    EnemyComponent,
    FighterComponent,
    BuildingsComponent,
    TileDetailComponent,
    FighterDetailComponent,
    SnapDirective,
    LongNumberPipe,
    MinimapDirective
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MaterialImportModule,
    PipeModule,
    ColorPickerModule
  ],
  entryComponents: [
    SaveDialogComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
