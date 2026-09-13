import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule, Routes } from '@angular/router';

import { RaffstoreOverviewComponent } from './components/raffstore-overview.component';
import { RaffstoreTileComponent } from './components/raffstore-tile.component';
import { RaffstoreDetailComponent } from './components/raffstore-detail.component';

const routes: Routes = [
  { path: '', component: RaffstoreOverviewComponent }
];

@NgModule({
  declarations: [
    RaffstoreTileComponent,
    RaffstoreDetailComponent,
    RaffstoreOverviewComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    RouterModule.forChild(routes)
  ]
})
export class RaffstoresModule {}
