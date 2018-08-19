import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { ClickerMainComponent } from './clicker-main/clicker-main.component';
import { MessagesComponent } from './messages/messages.component';
import { WorkersComponent } from './workers/workers.component';
import { StoreComponent } from './store/store.component';
import { UpgradesComponent } from './upgrades/upgrades.component';
import { MaterialImportModule } from './material-import/material-import.module';
import { PipeModule } from 'src/app/pipe/pipe.module';
import { AdminDebugComponent } from './admin-debug/admin-debug.component';
import { MapComponent } from './map/map.component';
import { ResourceDialogComponent } from './resource-dialog/resource-dialog.component';
import { UpgradeDialogComponent } from './upgrade-dialog/upgrade-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    ClickerMainComponent,
    MessagesComponent,
    WorkersComponent,
    StoreComponent,
    UpgradesComponent,
    AdminDebugComponent,
    MapComponent,
    ResourceDialogComponent,
    UpgradeDialogComponent
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
