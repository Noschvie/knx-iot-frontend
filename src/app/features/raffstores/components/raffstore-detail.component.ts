import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Raffstore, HEIGHT_STEPS, ANGLE_STEPS, HEIGHT_STEP_UP, HEIGHT_STEP_DOWN, Favorite } from '../models/raffstore.model';
import { RaffstoreService } from '../services/raffstore.service';

@Component({
  selector: 'app-raffstore-detail',
  templateUrl: './raffstore-detail.component.html',
  styleUrls: ['./raffstore-detail.component.scss']
})
export class RaffstoreDetailComponent implements OnInit {
  raffstore!: Raffstore;
  favorites: Favorite[] = [];

  HEIGHT_STEPS = HEIGHT_STEPS;
  ANGLE_STEPS = ANGLE_STEPS;

  heightSteps = [
    { value: 0, label: 'Auf' },
    { value: 1, label: '1/3' },
    { value: 2, label: '2/3' },
    { value: 3, label: 'Zu' }
  ];

  angleSteps = [
    { value: 0, label: 'Offen' },
    { value: 1, label: 'Schräg' },
    { value: 2, label: 'Zu' }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { raffstore: Raffstore },
    private dialogRef: MatDialogRef<RaffstoreDetailComponent>,
    private raffstoreService: RaffstoreService
  ) {
    this.raffstore = { ...data.raffstore };
  }

  ngOnInit(): void {
    this.favorites = this.raffstoreService.getFavorites(this.raffstore.floor);
  }

  moveUp(): void {
    this.raffstoreService.moveUp(this.raffstore.id);
    this.raffstore = { ...this.raffstore, heightStep: HEIGHT_STEP_UP };
  }

  moveStop(): void {
    this.raffstoreService.moveStop(this.raffstore.id);
  }

  moveDown(): void {
    this.raffstoreService.moveDown(this.raffstore.id);
    this.raffstore = { ...this.raffstore, heightStep: HEIGHT_STEP_DOWN };
  }

  setHeight(step: number): void {
    this.raffstore = { ...this.raffstore, heightStep: step };
    this.raffstoreService.setPosition(this.raffstore.id, step, this.raffstore.angleStep);
  }

  setAngle(step: number): void {
    this.raffstore = { ...this.raffstore, angleStep: step };
    this.raffstoreService.setPosition(this.raffstore.id, this.raffstore.heightStep, step);
  }

  applyFavorite(favorite: Favorite): void {
    this.raffstore = {
      ...this.raffstore,
      heightStep: favorite.heightStep,
      angleStep: favorite.angleStep
    };
    this.raffstoreService.applyFavorite(this.raffstore.id, favorite);
  }

  toggleAutoMode(): void {
    this.raffstoreService.toggleAutoMode(this.raffstore.id);
    this.raffstore = { ...this.raffstore, autoMode: !this.raffstore.autoMode };
  }

  close(): void {
    this.dialogRef.close();
  }
}
