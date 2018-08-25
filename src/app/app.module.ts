import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MaterialImportModule } from './material-import/material-import.module';
import { PipeModule } from 'src/app/pipe/pipe.module';

import { AppComponent } from './app.component';
import { ClickerMainComponent } from './components/clicker-main/clicker-main.component';
import { MessagesComponent } from './components/messages/messages.component';
import { WorkersComponent } from './components/workers/workers.component';
import { StoreComponent } from './components/store/store.component';
import { UpgradesComponent } from './components/upgrades/upgrades.component';
import { MapComponent } from './components/map/map.component';
import { SettingsComponent } from './components/settings/settings.component';
import { AdminDebugComponent } from './components/admin-debug/admin-debug.component';
import { ResourceDialogComponent } from './components/resource-dialog/resource-dialog.component';
import { UpgradeDialogComponent } from './components/upgrade-dialog/upgrade-dialog.component';
import { TouchDirective } from './directives/touch/touch.directive';
import { CropDirective } from './directives/crop/crop.directive';

@NgModule({
  declarations: [
    AppComponent,
    ClickerMainComponent,
    MessagesComponent,
    WorkersComponent,
    StoreComponent,
    UpgradesComponent,
    SettingsComponent,
    AdminDebugComponent,
    MapComponent,
    ResourceDialogComponent,
    UpgradeDialogComponent,
    TouchDirective,
    CropDirective
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MaterialImportModule,
    PipeModule
  ],
  entryComponents: [
    ResourceDialogComponent,
    UpgradeDialogComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
