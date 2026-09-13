import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';

import { RaffstoreOverviewComponent } from './components/raffstore-overview.component';
import { RaffstoreTileComponent } from './components/raffstore-tile.component';
import { RaffstoreDetailComponent } from './components/raffstore-detail.component';

@NgModule({
  declarations: [
    RaffstoreTileComponent,
    RaffstoreDetailComponent,
    RaffstoreOverviewComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule
  ]
})
export class RaffstoresModule {}
