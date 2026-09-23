/**
 * Raffstore Service - Angular Client
 * Communicates with BFF instead of directly with KNX Gateway
 * 
 * Architecture:
 * Angular Client → BFF → KNX Gateway
 * 
 * Benefits:
 * - No direct gateway logic in the frontend
 * - Centralized command handling
 * - Event-driven updates
 * - Better security and control
 */

import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '@core/config/config.service';
import { Raffstore, Favorite, HEIGHT_STEP_UP, HEIGHT_STEP_DOWN } from '../models/raffstore.model';
import { map, tap, catchError, switchMap, takeUntil, startWith } from 'rxjs/operators';

interface BFFResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class RaffstoreService implements OnInit, OnDestroy {
  private raffstores$ = new BehaviorSubject<Raffstore[]>([]);
  private selectedRaffstoreId$ = new BehaviorSubject<string | null>(null);
  private isLoading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);
  private destroy$ = new Subject<void>();

  private bffEndpoint: string = '';
  private pollInterval = 5000; // Poll every 5 seconds
  private eventSource: EventSource | null = null;

  // Favorites per floor
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

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.bffEndpoint = this.configService.getApiEndpoint().replace('/api/v2', '/api');
  }

  ngOnInit(): void {
    this.initialize();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnectEventSource();
  }

  /**
   * Initialize: Load raffstores and subscribe to events
   */
  private initialize(): void {
    console.log('[RaffstoreService] Initializing...');
    this.loadRaffstores();
    this.subscribeToEvents();
    this.pollRaffstores();
  }

  /**
   * Load all raffstores from BFF
   */
  private loadRaffstores(): void {
    this.isLoading$.next(true);
    this.http.get<BFFResponse<Raffstore[]>>(`${this.bffEndpoint}/raffstores`)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.raffstores$.next(response.data);
            this.error$.next(null);
            console.log(`[RaffstoreService] Loaded ${response.data.length} raffstores`);
          }
        }),
        catchError(err => {
          console.error('[RaffstoreService] Failed to load raffstores:', err);
          this.error$.next(err.message || 'Failed to load raffstores');
          return of(null);
        }),
        tap(() => this.isLoading$.next(false)),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Poll raffstores periodically to keep them in sync
   */
  private pollRaffstores(): void {
    interval(this.pollInterval)
      .pipe(
        startWith(0),
        switchMap(() => 
          this.http.get<BFFResponse<Raffstore[]>>(`${this.bffEndpoint}/raffstores`).pipe(
            catchError(err => {
              console.warn('[RaffstoreService] Poll failed:', err);
              return of(null);
            })
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(response => {
        if (response?.success && response.data) {
          this.raffstores$.next(response.data);
        }
      });
  }

  /**
   * Subscribe to BFF events via Server-Sent Events (SSE)
   */
  private subscribeToEvents(): void {
    try {
      const eventUrl = `${this.bffEndpoint}/raffstores/events`;
      console.log('[RaffstoreService] Connecting to event stream:', eventUrl);

      this.eventSource = new EventSource(eventUrl);

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[RaffstoreService] Event received:', data);
          
          // Trigger a refresh after event
          this.loadRaffstores();
        } catch (error) {
          console.error('[RaffstoreService] Failed to parse event:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('[RaffstoreService] Event stream error:', error);
        this.disconnectEventSource();
        // Try to reconnect after 5 seconds
        setTimeout(() => this.subscribeToEvents(), 5000);
      };
    } catch (error) {
      console.error('[RaffstoreService] Failed to connect to event stream:', error);
    }
  }

  /**
   * Disconnect event source
   */
  private disconnectEventSource(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Get observable stream of all raffstores
   */
  getRaffstores(): Observable<Raffstore[]> {
    return this.raffstores$.asObservable();
  }

  /**
   * Get observable stream for selected raffstore
   */
  getSelectedRaffstore(): Observable<Raffstore | null> {
    return this.selectedRaffstoreId$.pipe(
      switchMap(id => {
        if (!id) return of(null);
        return this.raffstores$.pipe(
          map(raffstores => raffstores.find(r => r.id === id) || null)
        );
      })
    );
  }

  /**
   * Select a raffstore
   */
  selectRaffstore(id: string): void {
    this.selectedRaffstoreId$.next(id);
  }

  /**
   * Deselect the selected raffstore
   */
  deselectRaffstore(): void {
    this.selectedRaffstoreId$.next(null);
  }

  /**
   * Get loading state
   */
  getLoadingState(): Observable<boolean> {
    return this.isLoading$.asObservable();
  }

  /**
   * Get error state
   */
  getError(): Observable<string | null> {
    return this.error$.asObservable();
  }

  /**
   * Get favorites for floor
   */
  getFavorites(floor: 'EG' | 'OG'): Favorite[] {
    return this.favorites[floor];
  }

  // ===== COMMANDS =====

  /**
   * Move up
   */
  moveUp(raffstoreId: string): Observable<Raffstore> {
    return this.http.post<BFFResponse<Raffstore>>(`${this.bffEndpoint}/raffstores/${raffstoreId}/moveUp`, {})
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.updateLocalRaffstore(response.data);
            console.log(`[RaffstoreService] Move UP sent: ${raffstoreId}`);
          }
        }),
        map(response => response.data!),
        catchError(err => this.handleError('moveUp', raffstoreId, err))
      );
  }

  /**
   * Move down
   */
  moveDown(raffstoreId: string): Observable<Raffstore> {
    return this.http.post<BFFResponse<Raffstore>>(`${this.bffEndpoint}/raffstores/${raffstoreId}/moveDown`, {})
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.updateLocalRaffstore(response.data);
            console.log(`[RaffstoreService] Move DOWN sent: ${raffstoreId}`);
          }
        }),
        map(response => response.data!),
        catchError(err => this.handleError('moveDown', raffstoreId, err))
      );
  }

  /**
   * Stop
   */
  moveStop(raffstoreId: string): Observable<Raffstore> {
    return this.http.post<BFFResponse<Raffstore>>(`${this.bffEndpoint}/raffstores/${raffstoreId}/stop`, {})
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.updateLocalRaffstore(response.data);
            console.log(`[RaffstoreService] Move STOP sent: ${raffstoreId}`);
          }
        }),
        map(response => response.data!),
        catchError(err => this.handleError('moveStop', raffstoreId, err))
      );
  }

  /**
   * Set height
   */
  setHeight(raffstoreId: string, heightStep: number): Observable<Raffstore> {
    return this.http.put<BFFResponse<Raffstore>>(
      `${this.bffEndpoint}/raffstores/${raffstoreId}/height`,
      { heightStep }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.updateLocalRaffstore(response.data);
          console.log(`[RaffstoreService] Height set: ${raffstoreId} → ${heightStep}`);
        }
      }),
      map(response => response.data!),
      catchError(err => this.handleError('setHeight', raffstoreId, err))
    );
  }

  /**
   * Set angle
   */
  setAngle(raffstoreId: string, angleStep: number): Observable<Raffstore> {
    return this.http.put<BFFResponse<Raffstore>>(
      `${this.bffEndpoint}/raffstores/${raffstoreId}/angle`,
      { angleStep }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.updateLocalRaffstore(response.data);
          console.log(`[RaffstoreService] Angle set: ${raffstoreId} → ${angleStep}`);
        }
      }),
      map(response => response.data!),
      catchError(err => this.handleError('setAngle', raffstoreId, err))
    );
  }

  /**
   * Set position (height + angle)
   */
  setPosition(raffstoreId: string, heightStep: number, angleStep: number): Observable<Raffstore> {
    return this.http.put<BFFResponse<Raffstore>>(
      `${this.bffEndpoint}/raffstores/${raffstoreId}/position`,
      { heightStep, angleStep }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.updateLocalRaffstore(response.data);
          console.log(`[RaffstoreService] Position set: ${raffstoreId} → ${heightStep}/${angleStep}`);
        }
      }),
      map(response => response.data!),
      catchError(err => this.handleError('setPosition', raffstoreId, err))
    );
  }

  /**
   * Apply favorite
   */
  applyFavorite(raffstoreId: string, favorite: Favorite): Observable<Raffstore> {
    return this.http.post<BFFResponse<Raffstore>>(
      `${this.bffEndpoint}/raffstores/${raffstoreId}/favorite`,
      { favorite }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.updateLocalRaffstore(response.data);
          console.log(`[RaffstoreService] Favorite applied: ${raffstoreId} → ${favorite.label}`);
        }
      }),
      map(response => response.data!),
      catchError(err => this.handleError('applyFavorite', raffstoreId, err))
    );
  }

  /**
   * Group command (all raffstores on a floor)
   */
  groupCommand(floor: 'EG' | 'OG', direction: 'up' | 'down'): Observable<Raffstore[]> {
    return this.http.post<BFFResponse<Raffstore[]>>(
      `${this.bffEndpoint}/raffstores/group/${floor}/${direction}`,
      {}
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.raffstores$.next(response.data);
          console.log(`[RaffstoreService] Group command: ${floor} ${direction}`);
        }
      }),
      map(response => response.data!),
      catchError(err => this.handleError('groupCommand', floor, err))
    );
  }

  /**
   * Update local raffstore state
   */
  private updateLocalRaffstore(updated: Raffstore): void {
    const current = this.raffstores$.value;
    const idx = current.findIndex(r => r.id === updated.id);
    if (idx >= 0) {
      current[idx] = updated;
      this.raffstores$.next([...current]);
    }
  }

  /**
   * Handle command errors
   */
  private handleError(operation: string, target: string, error: any): Observable<never> {
    const errorMsg = error?.error?.error || error?.message || 'Unknown error';
    console.error(`[RaffstoreService] ${operation} failed for ${target}:`, errorMsg);
    this.error$.next(`${operation} failed: ${errorMsg}`);
    throw error;
  }
}
