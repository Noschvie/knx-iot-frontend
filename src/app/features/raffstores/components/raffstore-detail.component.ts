import { ChangeDetectorRef, Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Raffstore,
  HEIGHT_STEPS,
  ANGLE_STEPS,
  HEIGHT_STEP_UP,
  HEIGHT_STEP_ONE_THIRD,
  HEIGHT_STEP_TWO_THIRDS,
  HEIGHT_STEP_DOWN,
  ANGLE_STEP_OPEN,
  ANGLE_STEP_TILTED,
  ANGLE_STEP_CLOSED,
  Favorite
} from '../models/raffstore.model';
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

  HEIGHT_STEPS = HEIGHT_STEPS;
  ANGLE_STEPS = ANGLE_STEPS;

  heightSteps = [
    { value: HEIGHT_STEP_UP, label: 'Auf' },
    { value: HEIGHT_STEP_ONE_THIRD, label: '1/3' },
    { value: HEIGHT_STEP_TWO_THIRDS, label: '2/3' },
    { value: HEIGHT_STEP_DOWN, label: 'Zu' }
  ];

  angleSteps = [
    { value: ANGLE_STEP_OPEN, label: 'Offen' },
    { value: ANGLE_STEP_TILTED, label: 'Schräg' },
    { value: ANGLE_STEP_CLOSED, label: 'Zu' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { raffstore: Raffstore },
    private dialogRef: MatDialogRef<RaffstoreDetailComponent>,
    private raffstoreService: RaffstoreService,
    private cdr: ChangeDetectorRef
  ) {
    this.raffstore = { ...data.raffstore };
  }

  ngOnInit(): void {
    this.favorites = this.raffstoreService.getFavorites(this.raffstore.floor);
    // Load the current status values from the backend
    this.refreshStatus();

    // Subscribe to live status feedback (position, lamella, end positions)
    this.raffstoreService.getRaffstores()
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => {
        const updated = list.find(r => r.id === this.raffstore.id);
        if (updated) {
          this.raffstore = { ...updated };
          this.cdr.detectChanges();
        }
      });

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
   * Load the current position and angle from the backend.
   */
  refreshStatus(): void {
    this.raffstoreService.loadCurrentStatus(this.raffstore.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        status => {
          this.raffstore = {
            ...this.raffstore,
            heightStep: status.heightStep,
            angleStep: status.angleStep,
            statusPositionPercent: status.statusPositionPercent ?? this.raffstore.statusPositionPercent
          };
          this.cdr.detectChanges();
          console.log(`[Detail] Status refreshed for ${this.raffstore.id}:`, status);
        },
        error => {
          console.error(`[Detail] Failed to load status:`, error);
        }
      );
  }

  /**
   * Move-up command: DPT 1.008 = 0 on 2/1/x.
   */
  moveUp(): void {
    console.log('[DetailComponent] moveUp clicked for:', this.raffstore.id);

    this.raffstoreService.moveUp(this.raffstore.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.raffstore = { ...this.raffstore, heightStep: HEIGHT_STEP_UP, isMoving: true };
          console.log(`✓ Move UP completed`);
        },
        error => {
          console.error(`✗ Move UP failed:`, error);
          // TODO: Show error toast
        }
      );
  }

  /**
   * Stop command: DPT 1.007 = 1 on 2/2/x.
   */
  moveStop(): void {
    console.log('[DetailComponent] moveStop clicked for:', this.raffstore.id);

    this.raffstoreService.moveStop(this.raffstore.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.raffstore = { ...this.raffstore, isMoving: false };
          // Refresh the current position after stopping.
          setTimeout(() => this.refreshStatus(), 500);
          console.log(`✓ Move STOP completed`);
        },
        error => {
          console.error(`✗ Move STOP failed:`, error);
        }
      );
  }

  /**
   * Move-down command: DPT 1.008 = 1 on 2/1/x.
   */
  moveDown(): void {
    console.log('[DetailComponent] moveDown clicked for:', this.raffstore.id);

    this.raffstoreService.moveDown(this.raffstore.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.raffstore = { ...this.raffstore, heightStep: HEIGHT_STEP_DOWN, isMoving: true };
          console.log(`✓ Move DOWN completed`);
        },
        error => {
          console.error(`✗ Move DOWN failed:`, error);
        }
      );
  }

  /**
   * Set the height: DPT 5.001 (0-100) on 2/3/x.
   */
  setHeight(step: number): void {
    this.raffstore = { ...this.raffstore, heightStep: step };

    this.raffstoreService.setHeight(this.raffstore.id, step)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          console.log(`✓ Height set to ${step}`);
        },
        error => {
          console.error(`✗ Set height failed:`, error);
          // TODO: Revert on error
        }
      );
  }

  /**
   * Set the slat angle: DPT 5.001 (0-100) on 2/4/x.
   */
  setAngle(step: number): void {
    this.raffstore = { ...this.raffstore, angleStep: step };

    this.raffstoreService.setAngle(this.raffstore.id, step)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          console.log(`✓ Angle set to ${step}`);
        },
        error => {
          console.error(`✗ Set angle failed:`, error);
        }
      );
  }

  /**
   * Apply a favorite.
   */
  applyFavorite(favorite: Favorite): void {
    this.raffstore = {
      ...this.raffstore,
      heightStep: favorite.heightStep,
      // Fully opening the blind should preserve its current slat angle.
      angleStep: favorite.heightStep === HEIGHT_STEP_UP
        ? this.raffstore.angleStep
        : favorite.angleStep
    };

    this.raffstoreService.applyFavorite(this.raffstore.id, favorite)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          console.log(`✓ Favorite '${favorite.label}' applied`);
        },
        error => {
          console.error(`✗ Apply favorite failed:`, error);
        }
      );
  }

  /**
   * Toggle automatic mode: DPT 1.001 on 2/7/x.
   * 0 = Manual (released), 1 = Automatic (locked).
   */
  toggleAutoMode(): void {
    this.raffstoreService.toggleAutoMode(this.raffstore.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          console.log(`✓ Auto mode toggled to ${this.raffstore.autoMode}`);
        },
        error => {
          console.error(`✗ Toggle auto mode failed:`, error);
        }
      );
  }

  /**
   * Close the dialog.
   */
  close(): void {
    this.dialogRef.close();
  }
}
