import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Raffstore } from '../models/raffstore.model';
import { RaffstoreService } from '../services/raffstore.service';

@Component({
  standalone: false,
  selector: 'app-raffstore-overview',
  templateUrl: './raffstore-overview.component.html',
  styleUrls: ['./raffstore-overview.component.scss']
})
export class RaffstoreOverviewComponent implements OnInit, OnDestroy {
  raffstoresEG: Raffstore[] = [];
  raffstoresOG: Raffstore[] = [];
  groupCommandInProgress: { EG?: boolean; OG?: boolean } = {};

  private destroy$ = new Subject<void>();

  constructor(
      private raffstoreService: RaffstoreService,
      private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.raffstoreService.getRaffstores()
        .pipe(takeUntil(this.destroy$))
        .subscribe(raffstores => {
          this.raffstoresEG = raffstores.filter(r => r.floor === 'EG');
          this.raffstoresOG = raffstores.filter(r => r.floor === 'OG');
          this.cdr.detectChanges();
        });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Gruppbefehl: Alle auf (Höhe = 0)
   */
  onGroupCommandUp(floor: 'EG' | 'OG'): void {
    this.groupCommandInProgress[floor] = true;
    this.raffstoreService.groupCommand(floor, 'up').subscribe({
      next: () => {
        console.log(`✓ Group command UP completed for floor: ${floor}`);
        this.groupCommandInProgress[floor] = false;
      },
      error: error => {
        console.error(`✗ Group command UP failed for floor: ${floor}`, error);
        this.groupCommandInProgress[floor] = false;
      }
    });
  }

  /**
   * Gruppbefehl: Alle zu (Höhe = 100)
   */
  onGroupCommandDown(floor: 'EG' | 'OG'): void {
    this.groupCommandInProgress[floor] = true;
    this.raffstoreService.groupCommand(floor, 'down').subscribe({
      next: () => {
        console.log(`✓ Group command DOWN completed for floor: ${floor}`);
        this.groupCommandInProgress[floor] = false;
      },
      error: error => {
        console.error(`✗ Group command DOWN failed for floor: ${floor}`, error);
        this.groupCommandInProgress[floor] = false;
      }
    });
  }
}
