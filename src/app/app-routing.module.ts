import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WorkersComponent } from './workers/workers.component';
import { StoreComponent } from './store/store.component';
import { UpgradesComponent } from './upgrades/upgrades.component';

const routes: Routes = [
  { path: '', redirectTo: '/workers', pathMatch: 'full' },
  { path: 'workers', component: WorkersComponent },
  { path: 'store', component: StoreComponent },
  { path: 'upgrades', component: UpgradesComponent }
]

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
