import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { ClickerMainComponent } from './clicker-main/clicker-main.component';
import { AppRoutingModule } from './/app-routing.module';
import { MessagesComponent } from './messages/messages.component';
import { WorkersComponent } from './workers/workers.component';
import { StoreComponent } from './store/store.component';
import { UpgradesComponent } from './upgrades/upgrades.component';
import { MaterialImportModule } from './material-import/material-import.module';
import { PipeModule } from 'src/app/pipe/pipe.module';
import { AdminDebugComponent } from './admin-debug/admin-debug.component';
import { AdminResourceConfigurationComponent } from './admin-resource-configuration/admin-resource-configuration.component';
import { AdminUpgradeConfigurationComponent } from './admin-upgrade-configuration/admin-upgrade-configuration.component';

@NgModule({
  declarations: [
    AppComponent,
    ClickerMainComponent,
    MessagesComponent,
    WorkersComponent,
    StoreComponent,
    UpgradesComponent,
    AdminDebugComponent,
    AdminResourceConfigurationComponent,
    AdminUpgradeConfigurationComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialImportModule,
    PipeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
