import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Raffstore } from '../models/raffstore.model';

@Injectable({ providedIn: 'root' })
export class RaffstoreService {
  // Mock-Daten für Prototype
  private raffstore$ = new BehaviorSubject<Raffstore>({
    id: '1/2/1',
    label: 'Wohnzimmer',
    floor: 'EG',
    orientation: 'N',
    heightStep: 0,  // Auf
    angleStep: 0,   // Offen
    isMoving: false,
    autoMode: false
  });

  constructor() {
    console.log('[RaffstoreService] Initialized with mock data');
  }

  getRaffstore(): Observable<Raffstore> {
    return this.raffstore$.asObservable();
  }

  /**
   * Set position (height + angle)
   */
  setPosition(heightStep: number, angleStep: number): void {
    const current = this.raffstore$.value;
    // Simulate movement
    this.raffstore$.next({ ...current, isMoving: true });

    setTimeout(() => {
      this.raffstore$.next({
        ...current,
        heightStep,
        angleStep,
        isMoving: false
      });
      console.log(`[RaffstoreService] Position set to ${heightStep}/${angleStep}`);
    }, 500);
  }

  /**
   * Set automation mode
   */
  setAutoMode(enabled: boolean): void {
    const current = this.raffstore$.value;
    this.raffstore$.next({ ...current, autoMode: enabled });
    console.log(`[RaffstoreService] Auto mode: ${enabled}`);
  }
}
