import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Raffstore } from '../models/raffstore.model';
import { RaffstoreService } from '../services/raffstore.service';

@Component({
  standalone: false,
  selector: 'app-raffstore-overview',
  templateUrl: './raffstore-overview.component.html',
  styleUrls: ['./raffstore-overview.component.scss']
})
export class RaffstoreOverviewComponent {
  raffstoresEG$: Observable<Raffstore[]>;
  raffstoresOG$: Observable<Raffstore[]>;
  groupCommandInProgress: { EG?: boolean; OG?: boolean } = {};

  constructor(private raffstoreService: RaffstoreService) {
    const raffstores$ = this.raffstoreService.getRaffstores();
    this.raffstoresEG$ = raffstores$.pipe(map(list => list.filter(r => r.floor === 'EG')));
    this.raffstoresOG$ = raffstores$.pipe(map(list => list.filter(r => r.floor === 'OG')));
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
