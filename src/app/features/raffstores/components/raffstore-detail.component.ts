import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Raffstore, HEIGHT_STEPS, ANGLE_STEPS, HEIGHT_STEP_UP, HEIGHT_STEP_DOWN, Favorite } from '../models/raffstore.model';
import { RaffstoreService } from '../services/raffstore.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-raffstore-detail',
  templateUrl: './raffstore-detail.component.html',
  styleUrls: ['./raffstore-detail.component.scss']
})
export class RaffstoreDetailComponent implements OnInit, OnDestroy {
  raffstore!: Raffstore;
  favorites: Favorite[] = [];
  isCommandInProgress = false;

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

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { raffstore: Raffstore },
    private dialogRef: MatDialogRef<RaffstoreDetailComponent>,
    private raffstoreService: RaffstoreService
  ) {
    this.raffstore = { ...data.raffstore };
  }

  ngOnInit(): void {
    this.favorites = this.raffstoreService.getFavorites(this.raffstore.floor);
    // Lade aktuelle Status-Werte vom Backend
    this.refreshStatus();

    // DEBUG: Log raffstore and loaded datapoints
    console.log('[DetailComponent] Init - raffstoreId:', this.raffstore.id);
    setTimeout(() => {
      this.raffstoreService.debugLogCache();
    }, 1000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Lade aktuelle Position und Winkel vom Backend
   */
  refreshStatus(): void {
    this.raffstoreService.loadCurrentStatus(this.raffstore.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        status => {
          this.raffstore = {
            ...this.raffstore,
            heightStep: status.heightStep,
            angleStep: status.angleStep
          };
          console.log(`[Detail] Status refreshed for ${this.raffstore.id}:`, status);
        },
        error => {
          console.error(`[Detail] Failed to load status:`, error);
        }
      );
  }

  /**
   * Auf-Befehl: DPT 1.008 = 0 zu 2/1/x
   */
  moveUp(): void {
    if (this.isCommandInProgress) return;
    this.isCommandInProgress = true;

    console.log('[DetailComponent] moveUp clicked for:', this.raffstore.id);

    this.raffstoreService.moveUp(this.raffstore.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.raffstore = { ...this.raffstore, heightStep: HEIGHT_STEP_UP, isMoving: true };
          this.isCommandInProgress = false;
          console.log(`✓ Move UP completed`);
        },
        error => {
          console.error(`✗ Move UP failed:`, error);
          this.isCommandInProgress = false;
          // TODO: Show error toast
        }
      );
  }

  /**
   * Stop-Befehl: DPT 1.007 = 1 zu 2/2/x
   */
  moveStop(): void {
    if (this.isCommandInProgress) return;
    this.isCommandInProgress = true;

    console.log('[DetailComponent] moveStop clicked for:', this.raffstore.id);

    this.raffstoreService.moveStop(this.raffstore.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.raffstore = { ...this.raffstore, isMoving: false };
          this.isCommandInProgress = false;
          // Refresh aktuelle Position nach Stop
          setTimeout(() => this.refreshStatus(), 500);
          console.log(`✓ Move STOP completed`);
        },
        error => {
          console.error(`✗ Move STOP failed:`, error);
          this.isCommandInProgress = false;
        }
      );
  }

  /**
   * Zu-Befehl: DPT 1.008 = 1 zu 2/1/x
   */
  moveDown(): void {
    if (this.isCommandInProgress) return;
    this.isCommandInProgress = true;

    console.log('[DetailComponent] moveDown clicked for:', this.raffstore.id);

    this.raffstoreService.moveDown(this.raffstore.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.raffstore = { ...this.raffstore, heightStep: HEIGHT_STEP_DOWN, isMoving: true };
          this.isCommandInProgress = false;
          console.log(`✓ Move DOWN completed`);
        },
        error => {
          console.error(`✗ Move DOWN failed:`, error);
          this.isCommandInProgress = false;
        }
      );
  }

  /**
   * Höhe setzen: DPT 5.001 (0-100) zu 2/3/x
   */
  setHeight(step: number): void {
    if (this.isCommandInProgress) return;
    this.isCommandInProgress = true;

    this.raffstore = { ...this.raffstore, heightStep: step };

    this.raffstoreService.setHeight(this.raffstore.id, step)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.isCommandInProgress = false;
          console.log(`✓ Height set to ${step}`);
        },
        error => {
          console.error(`✗ Set height failed:`, error);
          this.isCommandInProgress = false;
          // TODO: Revert on error
        }
      );
  }

  /**
   * Lamellenwinkel setzen: DPT 5.001 (0-100) zu 2/4/x
   */
  setAngle(step: number): void {
    if (this.isCommandInProgress) return;
    this.isCommandInProgress = true;

    this.raffstore = { ...this.raffstore, angleStep: step };

    this.raffstoreService.setAngle(this.raffstore.id, step)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.isCommandInProgress = false;
          console.log(`✓ Angle set to ${step}`);
        },
        error => {
          console.error(`✗ Set angle failed:`, error);
          this.isCommandInProgress = false;
        }
      );
  }

  /**
   * Favorit anwenden
   */
  applyFavorite(favorite: Favorite): void {
    if (this.isCommandInProgress) return;
    this.isCommandInProgress = true;

    this.raffstore = {
      ...this.raffstore,
      heightStep: favorite.heightStep,
      angleStep: favorite.angleStep
    };

    this.raffstoreService.applyFavorite(this.raffstore.id, favorite)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.isCommandInProgress = false;
          console.log(`✓ Favorite '${favorite.label}' applied`);
        },
        error => {
          console.error(`✗ Apply favorite failed:`, error);
          this.isCommandInProgress = false;
        }
      );
  }

  /**
   * Automatik-Modus umschalten: DPT 1.001 zu 2/7/x
   * 0 = Manuell (freigegeben), 1 = Automatik (gesperrt)
   */
  toggleAutoMode(): void {
    if (this.isCommandInProgress) return;
    this.isCommandInProgress = true;

    this.raffstoreService.toggleAutoMode(this.raffstore.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.isCommandInProgress = false;
          console.log(`✓ Auto mode toggled to ${this.raffstore.autoMode}`);
        },
        error => {
          console.error(`✗ Toggle auto mode failed:`, error);
          this.isCommandInProgress = false;
        }
      );
  }

  /**
   * Schließe Dialog
   */
  close(): void {
    this.dialogRef.close();
  }
}
