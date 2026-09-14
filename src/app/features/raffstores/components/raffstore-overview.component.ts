import { Component, OnInit, OnDestroy } from '@angular/core';
import { Raffstore } from '../models/raffstore.model';
import { RaffstoreService } from '../services/raffstore.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-raffstore-overview',
  templateUrl: './raffstore-overview.component.html',
  styleUrls: ['./raffstore-overview.component.scss']
})
export class RaffstoreOverviewComponent implements OnInit, OnDestroy {
  raffstores: Raffstore[] = [];
  raffstoresEG: Raffstore[] = [];
  raffstoresOG: Raffstore[] = [];
  isLoading = false;
  groupCommandInProgress: { EG?: boolean; OG?: boolean } = {};

  private destroy$ = new Subject<void>();

  constructor(private raffstoreService: RaffstoreService) {}

  ngOnInit(): void {
    // Lade Raffstores von Config
    this.raffstoreService.getRaffstores()
      .pipe(takeUntil(this.destroy$))
      .subscribe(raffstores => {
        this.raffstores = raffstores;
        this.raffstoresEG = raffstores.filter(r => r.floor === 'EG');
        this.raffstoresOG = raffstores.filter(r => r.floor === 'OG');
        console.log(`[Overview] Loaded ${raffstores.length} raffstores (EG: ${this.raffstoresEG.length}, OG: ${this.raffstoresOG.length})`);
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
    this.raffstoreService.groupCommand(floor, 'up').subscribe(
      () => {
        console.log(`✓ Group command UP completed for floor: ${floor}`);
        this.groupCommandInProgress[floor] = false;
      },
      error => {
        console.error(`✗ Group command UP failed for floor: ${floor}`, error);
        this.groupCommandInProgress[floor] = false;
        // TODO: Show error toast/snackbar
      }
    );
  }

  /**
   * Gruppbefehl: Alle zu (Höhe = 100)
   */
  onGroupCommandDown(floor: 'EG' | 'OG'): void {
    this.groupCommandInProgress[floor] = true;
    this.raffstoreService.groupCommand(floor, 'down').subscribe(
      () => {
        console.log(`✓ Group command DOWN completed for floor: ${floor}`);
        this.groupCommandInProgress[floor] = false;
      },
      error => {
        console.error(`✗ Group command DOWN failed for floor: ${floor}`, error);
        this.groupCommandInProgress[floor] = false;
        // TODO: Show error toast/snackbar
      }
    );
  }
}
