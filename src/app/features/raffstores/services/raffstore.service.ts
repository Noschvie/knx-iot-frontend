import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Raffstore, Favorite, HEIGHT_STEP_UP, HEIGHT_STEP_DOWN } from '../models/raffstore.model';

@Injectable({ providedIn: 'root' })
export class RaffstoreService {
  private raffstores$ = new BehaviorSubject<Raffstore[]>(this.getMockRaffstores());
  private selectedRaffstoreId$ = new BehaviorSubject<string | null>(null);

  // Favoriten je Stockwerk
  private favorites: Record<'EG' | 'OG', Favorite[]> = {
    EG: [
      { label: 'Sonnenschutz', heightStep: 1, angleStep: 1 },
      { label: 'Ganz zu', heightStep: HEIGHT_STEP_DOWN, angleStep: 2 },
      { label: 'Ganz auf', heightStep: HEIGHT_STEP_UP, angleStep: 0 }
    ],
    OG: [
      { label: 'Sonnenschutz', heightStep: 1, angleStep: 1 },
      { label: 'Ganz zu', heightStep: HEIGHT_STEP_DOWN, angleStep: 2 },
      { label: 'Ganz auf', heightStep: HEIGHT_STEP_UP, angleStep: 0 }
    ]
  };

  constructor() {}

  getRaffstores(): Observable<Raffstore[]> {
    return this.raffstores$.asObservable();
  }

  getSelectedRaffstore(): Observable<Raffstore | null> {
    return this.selectedRaffstoreId$.pipe(
      (obsId) => {
        return new Observable(observer => {
          obsId.subscribe(id => {
            if (id) {
              const raffstore = this.raffstores$.value.find(r => r.id === id);
              observer.next(raffstore || null);
            } else {
              observer.next(null);
            }
          });
        });
      }
    );
  }

  selectRaffstore(id: string): void {
    this.selectedRaffstoreId$.next(id);
  }

  deselectRaffstore(): void {
    this.selectedRaffstoreId$.next(null);
  }

  /**
   * Setze Position für ein einzelnes Raffstore
   */
  setPosition(raffstoreId: string, heightStep: number, angleStep: number): void {
    const raffstores = this.raffstores$.value;
    const index = raffstores.findIndex(r => r.id === raffstoreId);
    if (index === -1) return;

    const updated = [...raffstores];
    updated[index] = {
      ...updated[index],
      heightStep,
      angleStep,
      isMoving: false
    };
    this.raffstores$.next(updated);
    console.log(`[RaffstoreService] Position set: ${raffstoreId} -> height=${heightStep}, angle=${angleStep}`);
  }

  /**
   * Auf-Befehl (DPT 1.008 MOVE_UP)
   */
  moveUp(raffstoreId: string): void {
    const raffstores = this.raffstores$.value;
    const index = raffstores.findIndex(r => r.id === raffstoreId);
    if (index === -1) return;

    const updated = [...raffstores];
    updated[index] = {
      ...updated[index],
      heightStep: HEIGHT_STEP_UP,
      isMoving: false
    };
    this.raffstores$.next(updated);
    console.log(`[RaffstoreService] Move UP: ${raffstoreId}`);
  }

  /**
   * Zu-Befehl (DPT 1.008 MOVE_DOWN)
   */
  moveDown(raffstoreId: string): void {
    const raffstores = this.raffstores$.value;
    const index = raffstores.findIndex(r => r.id === raffstoreId);
    if (index === -1) return;

    const updated = [...raffstores];
    updated[index] = {
      ...updated[index],
      heightStep: HEIGHT_STEP_DOWN,
      isMoving: false
    };
    this.raffstores$.next(updated);
    console.log(`[RaffstoreService] Move DOWN: ${raffstoreId}`);
  }

  /**
   * Stopp-Befehl (DPT 1.007 STEP)
   */
  moveStop(raffstoreId: string): void {
    const raffstores = this.raffstores$.value;
    const index = raffstores.findIndex(r => r.id === raffstoreId);
    if (index === -1) return;

    const updated = [...raffstores];
    updated[index] = {
      ...updated[index],
      isMoving: false
    };
    this.raffstores$.next(updated);
    console.log(`[RaffstoreService] Move STOP: ${raffstoreId}`);
  }

  /**
   * Gruppbefehl: Alle Raffstores eines Stockwerks
   */
  groupCommand(floor: 'EG' | 'OG', command: 'up' | 'down'): void {
    const raffstores = this.raffstores$.value;
    const updated = raffstores.map(r => {
      if (r.floor === floor) {
        if (command === 'up') {
          return { ...r, heightStep: HEIGHT_STEP_UP, isMoving: false };
        } else {
          return { ...r, heightStep: HEIGHT_STEP_DOWN, isMoving: false };
        }
      }
      return r;
    });
    this.raffstores$.next(updated);
    console.log(`[RaffstoreService] Group command: ${floor} ${command}`);
  }

  /**
   * Favorit anwenden
   */
  applyFavorite(raffstoreId: string, favorite: Favorite): void {
    this.setPosition(raffstoreId, favorite.heightStep, favorite.angleStep);
  }

  /**
   * Automatik-Modus umschalten
   */
  toggleAutoMode(raffstoreId: string): void {
    const raffstores = this.raffstores$.value;
    const index = raffstores.findIndex(r => r.id === raffstoreId);
    if (index === -1) return;

    const updated = [...raffstores];
    updated[index] = {
      ...updated[index],
      autoMode: !updated[index].autoMode
    };
    this.raffstores$.next(updated);
    console.log(`[RaffstoreService] Auto mode toggled: ${raffstoreId} -> ${updated[index].autoMode}`);
  }

  /**
   * Favoriten für ein Stockwerk abrufen
   */
  getFavorites(floor: 'EG' | 'OG'): Favorite[] {
    return this.favorites[floor];
  }

  /**
   * Mock-Daten: 17 Raffstores
   */
  private getMockRaffstores(): Raffstore[] {
    return [
      // EG (9)
      { id: '1', name: 'Wohnzimmer Süd', floor: 'EG', orientation: 'SUED', heightStep: 1, angleStep: 1, autoMode: true },
      { id: '2', name: 'Wohnzimmer West', floor: 'EG', orientation: 'WEST', heightStep: 1, angleStep: 1, autoMode: true },
      { id: '3', name: 'Küche', floor: 'EG', orientation: 'OST', heightStep: 0, angleStep: 0, autoMode: false },
      { id: '4', name: 'Esszimmer', floor: 'EG', orientation: 'SUED', heightStep: 1, angleStep: 1, autoMode: true },
      { id: '5', name: 'Büro', floor: 'EG', orientation: 'OST', heightStep: 2, angleStep: 2, autoMode: false, isMoving: true },
      { id: '6', name: 'Gästezimmer', floor: 'EG', orientation: 'NORD', heightStep: 0, angleStep: 0, autoMode: false },
      { id: '7', name: 'Windfang', floor: 'EG', orientation: 'WEST', heightStep: 3, angleStep: 0, autoMode: false },
      { id: '8', name: 'Terrasse', floor: 'EG', orientation: 'SUED', heightStep: 1, angleStep: 1, autoMode: true },
      { id: '9', name: 'Sauna', floor: 'EG', orientation: 'NORD', heightStep: 3, angleStep: 0, autoMode: false },
      // OG (8)
      { id: '10', name: 'Schlafzimmer', floor: 'OG', orientation: 'SUED', heightStep: 2, angleStep: 1, autoMode: false },
      { id: '11', name: 'Kinderzimmer 1', floor: 'OG', orientation: 'OST', heightStep: 0, angleStep: 0, autoMode: false },
      { id: '12', name: 'Kinderzimmer 2', floor: 'OG', orientation: 'WEST', heightStep: 0, angleStep: 0, autoMode: false },
      { id: '13', name: 'Bad', floor: 'OG', orientation: 'NORD', heightStep: 3, angleStep: 0, autoMode: false },
      { id: '14', name: 'Ankleide', floor: 'OG', orientation: 'SUED', heightStep: 1, angleStep: 1, autoMode: true },
      { id: '15', name: 'Flur', floor: 'OG', orientation: 'NORD', heightStep: 0, angleStep: 0, autoMode: false },
      { id: '16', name: 'Balkon', floor: 'OG', orientation: 'SUED', heightStep: 1, angleStep: 1, autoMode: true },
      { id: '17', name: 'Gästebad', floor: 'OG', orientation: 'WEST', heightStep: 3, angleStep: 0, autoMode: false }
    ];
  }
}
