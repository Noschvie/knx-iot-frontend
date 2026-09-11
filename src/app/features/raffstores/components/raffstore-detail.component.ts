import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Raffstore, HEIGHT_STEPS, ANGLE_STEPS } from '../models/raffstore.model';
import { RaffstoreService } from '../services/raffstore.service';

@Component({
  standalone: false,
  selector: 'app-raffstore-detail',
  templateUrl: './raffstore-detail.component.html',
  styleUrls: ['./raffstore-detail.component.scss']
})
export class RaffstoreDetailComponent implements OnInit {
  raffstore!: Raffstore;
  HEIGHT_STEPS = HEIGHT_STEPS;
  ANGLE_STEPS = ANGLE_STEPS;

  // Favorites (mock)
  favorites = [
    { label: 'Sonnenschutz', height: 1, angle: 1 },
    { label: 'Ganz zu', height: 3, angle: 2 },
    { label: 'Lüften', height: 2, angle: 1 },
    { label: 'Ganz auf', height: 0, angle: 0 }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { raffstore: Raffstore },
    private dialogRef: MatDialogRef<RaffstoreDetailComponent>,
    private raffstoreService: RaffstoreService
  ) {
    this.raffstore = data.raffstore;
  }

  ngOnInit(): void {
    // Subscribe to updates
    this.raffstoreService.getRaffstore().subscribe(raffstore => {
      this.raffstore = raffstore;
    });
  }

  // Quick commands
  moveUp(): void {
    this.raffstoreService.setPosition(0, this.raffstore.angleStep);
  }

  moveStop(): void {
    // Keep current position but stop movement
    console.log('[Detail] Stopped');
  }

  moveDown(): void {
    this.raffstoreService.setPosition(3, this.raffstore.angleStep);
  }

  // Slider changes
  onHeightChange(step: number): void {
    this.raffstoreService.setPosition(step, this.raffstore.angleStep);
  }

  onAngleChange(step: number): void {
    this.raffstoreService.setPosition(this.raffstore.heightStep, step);
  }

  // Apply favorite
  applyFavorite(fav: any): void {
    this.raffstoreService.setPosition(fav.height, fav.angle);
  }

  toggleAutoMode(): void {
    this.raffstoreService.setAutoMode(!this.raffstore.autoMode);
  }

  // Get percentage for visual display
  getHeightPercent(): number {
    return ((3 - this.raffstore.heightStep) / 3) * 100;
  }

  getAnglePercent(): number {
    return (this.raffstore.angleStep / 2) * 100;
  }

  close(): void {
    this.dialogRef.close();
  }
}
