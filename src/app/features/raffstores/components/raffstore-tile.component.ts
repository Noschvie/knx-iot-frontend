import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Raffstore, HEIGHT_STEPS, ANGLE_STEPS } from '../models/raffstore.model';
import { RaffstoreService } from '../services/raffstore.service';
import { RaffstoreDetailComponent } from './raffstore-detail.component';

@Component({
  standalone: false,
  selector: 'app-raffstore-tile',
  templateUrl: './raffstore-tile.component.html',
  styleUrls: ['./raffstore-tile.component.scss']
})
export class RaffstoreTileComponent implements OnInit, OnChanges {
  @Input() raffstore!: Raffstore;

  heightLabel = '';
  angleLabel = '';
  HEIGHT_STEPS = HEIGHT_STEPS;
  ANGLE_STEPS = ANGLE_STEPS;

  constructor(
    private raffstoreService: RaffstoreService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.updateLabels();
  }

  ngOnChanges(): void {
    this.updateLabels();
  }

  private updateLabels(): void {
    this.heightLabel = HEIGHT_STEPS[this.raffstore.heightStep];
    this.angleLabel = ANGLE_STEPS[this.raffstore.angleStep];
  }

  setPosition(height: number, angle: number): void {
    this.raffstoreService.setPosition(height, angle);
  }

  toggleAutoMode(): void {
    this.raffstoreService.setAutoMode(!this.raffstore.autoMode);
  }

  openDetail(): void {
    this.dialog.open(RaffstoreDetailComponent, {
      width: '650px',
      maxWidth: '90vw',
      data: { raffstore: this.raffstore }
    });
  }

  // Icons für Bewegungsrichtung
  getMovementIcon(): string {
    if (!this.raffstore.isMoving) return '';
    // Später: Icon basierend auf letzter Bewegung
    return '↕';
  }
}
