import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { ClickerMainComponent } from './components/clicker-main/clicker-main.component';
import { MessagesComponent } from './components/messages/messages.component';
import { WorkersComponent } from './components/workers/workers.component';
import { StoreComponent } from './components/store/store.component';
import { UpgradesComponent } from './components/upgrades/upgrades.component';
import { MaterialImportModule } from './material-import/material-import.module';
import { PipeModule } from 'src/app/pipe/pipe.module';
import { AdminDebugComponent } from './components/admin-debug/admin-debug.component';
import { MapComponent } from './components/map/map.component';
import { ResourceDialogComponent } from './components/resource-dialog/resource-dialog.component';
import { UpgradeDialogComponent } from './components/upgrade-dialog/upgrade-dialog.component';
import { TouchDirective } from './directive/touch/touch.directive';

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
    UpgradeDialogComponent,
    TouchDirective,
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
