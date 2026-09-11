import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@shared/shared.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';

import { RaffstoreOverviewComponent } from './components/raffstore-overview.component';
import { RaffstoreTileComponent } from './components/raffstore-tile.component';
import { RaffstoreDetailComponent } from './components/raffstore-detail.component';

const routes: Routes = [
  { path: '', component: RaffstoreOverviewComponent }
];

@NgModule({
  declarations: [
    RaffstoreOverviewComponent,
    RaffstoreTileComponent,
    RaffstoreDetailComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    MatDialogModule
  ]
})
export class RaffstoresModule {}
