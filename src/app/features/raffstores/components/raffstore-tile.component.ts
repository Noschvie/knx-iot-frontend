import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Raffstore, HEIGHT_STEPS, ANGLE_STEPS } from '../models/raffstore.model';
import { RaffstoreDetailComponent } from './raffstore-detail.component';

@Component({
  standalone: false,
  selector: 'app-raffstore-tile',
  templateUrl: './raffstore-tile.component.html',
  styleUrls: ['./raffstore-tile.component.scss']
})
export class RaffstoreTileComponent {
  @Input() raffstore!: Raffstore;

  HEIGHT_STEPS = HEIGHT_STEPS;
  ANGLE_STEPS = ANGLE_STEPS;

  constructor(private dialog: MatDialog) {}

  openDetail(): void {
    this.dialog.open(RaffstoreDetailComponent, {
      width: '460px',
      maxWidth: '90vw',
      data: { raffstore: this.raffstore }
    });
  }
}
