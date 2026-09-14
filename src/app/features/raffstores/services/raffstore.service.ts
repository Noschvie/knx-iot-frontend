import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '@core/config/config.service';
import { Raffstore, Favorite, HEIGHT_STEP_UP, HEIGHT_STEP_DOWN } from '../models/raffstore.model';
import { RAFFSTORE_CONFIG, RaffstoreDatapoints } from '../config/raffstore.config';
import { map, tap, catchError } from 'rxjs/operators';

/**
 * DPT 5.001 Mapping: Diskrete Stufen (0-3 für Höhe, 0-2 für Winkel) ↔ KNX Prozent (0-100)
 */
const STEP_TO_KNX = {
  height: { 0: 0, 1: 33, 2: 66, 3: 100 },
  angle: { 0: 0, 1: 50, 2: 100 }
};

const KNX_TO_STEP = {
  height: { 0: 0, 25: 0, 33: 1, 50: 1, 66: 2, 75: 2, 100: 3 },
  angle: { 0: 0, 25: 0, 50: 1, 75: 1, 100: 2 }
};

@Injectable({ providedIn: 'root' })
export class RaffstoreService {
  private raffstores$ = new BehaviorSubject<Raffstore[]>([]);
  private selectedRaffstoreId$ = new BehaviorSubject<string | null>(null);
  private apiEndpoint: string = '';

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

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.apiEndpoint = this.configService.getApiEndpoint();
    this.initializeRaffstores();
  }

  /**
   * Initialisiere Raffstores aus Config
   * Wird beim Service-Konstruktor aufgerufen
   * @private
   */
  private initializeRaffstores(): void {
    const raffstores = RAFFSTORE_CONFIG.map(config => ({
      id: config.id,
      name: config.name,
      floor: config.floor,
      orientation: config.orientation,
      heightStep: 1,
      angleStep: 1,
      autoMode: false,
      isMoving: false
    }));
    this.raffstores$.next(raffstores);
    console.log(`[RaffstoreService] Initialized ${raffstores.length} raffstores from config`);
  }

  /**
   * Hole Observable-Stream aller Raffstores
   * @returns Observable mit Array aller Raffstores (initialisiert aus RAFFSTORE_CONFIG)
   */
  getRaffstores(): Observable<Raffstore[]> {
    return this.raffstores$.asObservable();
  }

  /**
   * Hole Observable-Stream für ausgewählten Raffstore
   * @returns Observable mit einem Raffstore oder null wenn nichts ausgewählt
   */
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

  /**
   * Wähle ein Raffstore aus (für Detail-Ansicht)
   * @param id ID des zu wählenden Raffstores
   */
  selectRaffstore(id: string): void {
    this.selectedRaffstoreId$.next(id);
  }

  /**
   * Deselektiere den ausgewählten Raffstore
   */
  deselectRaffstore(): void {
    this.selectedRaffstoreId$.next(null);
  }

  /**
   * Auf-Befehl (DPT 1.008 MOVE_UP = 0)
   * Schreibe zu 2/1/x (gaMove)
   * @param raffstoreId ID des Raffstores (z.B. 'rs-1')
   * @returns Observable<void> Befehl wurde gesendet
   */
  moveUp(raffstoreId: string): Observable<void> {
    const config = this.getConfig(raffstoreId);
    const payload = {
      data: [{
        type: 'datapoint',
        id: config.gaMove,
        attributes: { value: '0' }  // DPT 1.008: 0 = Up
      }]
    };

    return this.http.put<any>(`${this.apiEndpoint}/datapoints/values`, payload).pipe(
      tap(() => {
        this.updateRaffstoreInList(raffstoreId, { heightStep: HEIGHT_STEP_UP, isMoving: true });
        console.log(`[RaffstoreService] Move UP: ${raffstoreId}`);
      }),
      map(() => void 0),
      catchError(err => this.handleError('moveUp', raffstoreId, err))
    );
  }

  /**
   * Zu-Befehl (DPT 1.008 MOVE_DOWN = 1)
   * Schreibe zu 2/1/x (gaMove)
   * @param raffstoreId ID des Raffstores (z.B. 'rs-1')
   * @returns Observable<void> Befehl wurde gesendet
   */
  moveDown(raffstoreId: string): Observable<void> {
    const config = this.getConfig(raffstoreId);
    const payload = {
      data: [{
        type: 'datapoint',
        id: config.gaMove,
        attributes: { value: '1' }  // DPT 1.008: 1 = Down
      }]
    };

    return this.http.put<any>(`${this.apiEndpoint}/datapoints/values`, payload).pipe(
      tap(() => {
        this.updateRaffstoreInList(raffstoreId, { heightStep: HEIGHT_STEP_DOWN, isMoving: true });
        console.log(`[RaffstoreService] Move DOWN: ${raffstoreId}`);
      }),
      map(() => void 0),
      catchError(err => this.handleError('moveDown', raffstoreId, err))
    );
  }

  /**
   * Stop-Befehl (DPT 1.007 STEP = 1)
   * Schreibe zu 2/2/x (gaStep)
   * @param raffstoreId ID des Raffstores (z.B. 'rs-1')
   * @returns Observable<void> Befehl wurde gesendet
   */
  moveStop(raffstoreId: string): Observable<void> {
    const config = this.getConfig(raffstoreId);
    const payload = {
      data: [{
        type: 'datapoint',
        id: config.gaStep,
        attributes: { value: '1' }  // DPT 1.007: Step/Stop
      }]
    };

    return this.http.put<any>(`${this.apiEndpoint}/datapoints/values`, payload).pipe(
      tap(() => {
        this.updateRaffstoreInList(raffstoreId, { isMoving: false });
        console.log(`[RaffstoreService] Move STOP: ${raffstoreId}`);
      }),
      map(() => void 0),
      catchError(err => this.handleError('moveStop', raffstoreId, err))
    );
  }

  /**
   * Höhe setzen: Schreibe DPT 5.001 (0-100) zu 2/3/x (gaPositionSet)
   * @param raffstoreId ID des Raffstores (z.B. 'rs-1')
   * @param step 0-3 → konvertiert zu 0-100 (Auf → 1/3 → 2/3 → Zu)
   */
  setHeight(raffstoreId: string, step: number): Observable<void> {
    const config = this.getConfig(raffstoreId);
    const knxValue = (STEP_TO_KNX.height as any)[step] ?? 0;

    const payload = {
      data: [{
        type: 'datapoint',
        id: config.gaPositionSet,
        attributes: { value: knxValue.toString() }  // DPT 5.001: 0-100
      }]
    };

    return this.http.put<any>(`${this.apiEndpoint}/datapoints/values`, payload).pipe(
      tap(() => {
        this.updateRaffstoreInList(raffstoreId, { heightStep: step });
        console.log(`[RaffstoreService] Height set: ${raffstoreId} → ${step}`);
      }),
      map(() => void 0),
      catchError(err => this.handleError('setHeight', raffstoreId, err))
    );
  }

  /**
   * Lamellenwinkel setzen: Schreibe DPT 5.001 (0-100) zu 2/4/x (gaLamellasSet)
   * @param raffstoreId ID des Raffstores (z.B. 'rs-1')
   * @param step 0-2 → konvertiert zu 0-100 (Offen → Schräg → Zu)
   */
  setAngle(raffstoreId: string, step: number): Observable<void> {
    const config = this.getConfig(raffstoreId);
    const knxValue = (STEP_TO_KNX.angle as any)[step] ?? 0;

    const payload = {
      data: [{
        type: 'datapoint',
        id: config.gaLamellasSet,
        attributes: { value: knxValue.toString() }  // DPT 5.001: 0-100
      }]
    };

    return this.http.put<any>(`${this.apiEndpoint}/datapoints/values`, payload).pipe(
      tap(() => {
        this.updateRaffstoreInList(raffstoreId, { angleStep: step });
        console.log(`[RaffstoreService] Angle set: ${raffstoreId} → ${step}`);
      }),
      map(() => void 0),
      catchError(err => this.handleError('setAngle', raffstoreId, err))
    );
  }

  /**
   * Position (Höhe + Winkel) setzen
   * Schreibe zu 2/3/x und 2/4/x (gaPositionSet und gaLamellasSet)
   * @param raffstoreId ID des Raffstores (z.B. 'rs-1')
   * @param heightStep 0-3 (Auf → 1/3 → 2/3 → Zu)
   * @param angleStep 0-2 (Offen → Schräg → Zu)
   * @returns Observable<void> Befehl wurde gesendet
   */
  setPosition(raffstoreId: string, heightStep: number, angleStep: number): Observable<void> {
    const config = this.getConfig(raffstoreId);
    const heightValue = (STEP_TO_KNX.height as any)[heightStep];
    const angleValue = (STEP_TO_KNX.angle as any)[angleStep];

    const payload = {
      data: [
        {
          type: 'datapoint',
          id: config.gaPositionSet,
          attributes: { value: heightValue.toString() }
        },
        {
          type: 'datapoint',
          id: config.gaLamellasSet,
          attributes: { value: angleValue.toString() }
        }
      ]
    };

    return this.http.put<any>(`${this.apiEndpoint}/datapoints/values`, payload).pipe(
      tap(() => {
        this.updateRaffstoreInList(raffstoreId, { heightStep, angleStep });
        console.log(`[RaffstoreService] Position set: ${raffstoreId} → height=${heightStep}, angle=${angleStep}`);
      }),
      map(() => void 0),
      catchError(err => this.handleError('setPosition', raffstoreId, err))
    );
  }

  /**
   * Gruppbefehl: Alle Raffstores eines Stockwerks
   * Schreibe zu allen 2/1/x (gaMove) für diesen Floor
   * @param floor Stockwerk ('EG' = Erdgeschoss oder 'OG' = Obergeschoss)
   * @param command Bewegungsrichtung ('up' = nach oben, 'down' = nach unten)
   * @returns Observable<void> Befehl wurde gesendet
   */
  groupCommand(floor: 'EG' | 'OG', command: 'up' | 'down'): Observable<void> {
    const knxValue = command === 'up' ? '0' : '1';  // DPT 1.008
    const raffstoredForFloor = RAFFSTORE_CONFIG.filter(c => c.floor === floor);

    const payload = {
      data: raffstoredForFloor.map(config => ({
        type: 'datapoint',
        id: config.gaMove,
        attributes: { value: knxValue }
      }))
    };

    return this.http.put<any>(`${this.apiEndpoint}/datapoints/values`, payload).pipe(
      tap(() => {
        const heightStep = command === 'up' ? HEIGHT_STEP_UP : HEIGHT_STEP_DOWN;
        this.updateRaffstoresForFloor(floor, { heightStep, isMoving: false });
        console.log(`[RaffstoreService] Group command: ${floor} ${command}`);
      }),
      map(() => void 0),
      catchError(err => this.handleError('groupCommand', floor, err))
    );
  }

  /**
   * Favorit anwenden
   * @param raffstoreId ID des Raffstores (z.B. 'rs-1')
   * @param favorite Favorit-Objekt mit Höhe und Winkel-Stufe
   * @returns Observable<void> Position wurde gesetzt
   */
  applyFavorite(raffstoreId: string, favorite: Favorite): Observable<void> {
    return this.setPosition(raffstoreId, favorite.heightStep, favorite.angleStep);
  }

  /**
   * Automatik-Modus umschalten (schreibe zu 2/7/x - gaLock)
   * @param raffstoreId ID des Raffstores (z.B. 'rs-1')
   * @returns Observable<void> Befehl wurde gesendet
   */
  toggleAutoMode(raffstoreId: string): Observable<void> {
    const config = this.getConfig(raffstoreId);
    const raffstore = this.raffstores$.value.find(r => r.id === raffstoreId);
    const newValue = raffstore?.autoMode ? '1' : '0';  // 0=freigegeben (manuell), 1=gesperrt (auto)

    const payload = {
      data: [{
        type: 'datapoint',
        id: config.gaLock,
        attributes: { value: newValue }  // DPT 1.001
      }]
    };

    return this.http.put<any>(`${this.apiEndpoint}/datapoints/values`, payload).pipe(
      tap(() => {
        this.updateRaffstoreInList(raffstoreId, { autoMode: !raffstore?.autoMode });
        console.log(`[RaffstoreService] Auto mode toggled: ${raffstoreId} → ${!raffstore?.autoMode}`);
      }),
      map(() => void 0),
      catchError(err => this.handleError('toggleAutoMode', raffstoreId, err))
    );
  }

  /**
   * Lade aktuelle Status-Werte vom Backend
   * Liest 2/5/x (gaStatusPosition) und 2/6/x (gaStatusLamellus)
   * @param raffstoreId ID des Raffstores (z.B. 'rs-1')
   * @returns Observable mit Höhen- und Winkel-Stufen
   */
  loadCurrentStatus(raffstoreId: string): Observable<{ heightStep: number; angleStep: number }> {
    const config = this.getConfig(raffstoreId);

    return forkJoin([
      this.http.get<any>(`${this.apiEndpoint}/datapoints/${encodeURIComponent(config.gaStatusPosition)}`),
      this.http.get<any>(`${this.apiEndpoint}/datapoints/${encodeURIComponent(config.gaStatusLamellus)}`)
    ]).pipe(
      map(([heightRes, angleRes]) => {
        const heightValue = parseInt(heightRes.data.attributes.value || '0');
        const angleValue = parseInt(angleRes.data.attributes.value || '0');

        return {
          heightStep: this.knxToStep('height', heightValue),
          angleStep: this.knxToStep('angle', angleValue)
        };
      }),
      tap(status => {
        this.updateRaffstoreInList(raffstoreId, status);
        console.log(`[RaffstoreService] Status loaded: ${raffstoreId} → ${JSON.stringify(status)}`);
      }),
      catchError(err => {
        console.error(`[RaffstoreService] Error loading status for ${raffstoreId}:`, err);
        return of({ heightStep: 1, angleStep: 1 });
      })
    );
  }

  /**
   * Favoriten für ein Stockwerk abrufen
   * @param floor Stockwerk ('EG' oder 'OG')
   * @returns Array von Favoriten für den Stockwerk
   */
  getFavorites(floor: 'EG' | 'OG'): Favorite[] {
    return this.favorites[floor];
  }

  // ========== PRIVATE HELPERS ==========

  /**
   * Hole Config für eine Raffstore-ID
   * @param raffstoreId ID des Raffstores
   * @returns Konfigurations-Objekt oder wirft Error wenn nicht gefunden
   */
  private getConfig(raffstoreId: string): RaffstoreDatapoints {
    const config = RAFFSTORE_CONFIG.find(c => c.id === raffstoreId);
    if (!config) {
      throw new Error(`[RaffstoreService] Config not found for raffstore: ${raffstoreId}`);
    }
    return config;
  }

  /**
   * Update ein einzelnes Raffstore in der Liste
   * @param raffstoreId ID des Raffstores
   * @param updates Teilweise Update-Objekt mit zu ändernden Feldern
   */
  private updateRaffstoreInList(raffstoreId: string, updates: Partial<Raffstore>): void {
    const raffstores = this.raffstores$.value;
    const index = raffstores.findIndex(r => r.id === raffstoreId);
    if (index === -1) return;

    const updated = [...raffstores];
    updated[index] = { ...updated[index], ...updates };
    this.raffstores$.next(updated);
  }

  /**
   * Update alle Raffstores eines Stockwerks
   * @param floor Stockwerk ('EG' oder 'OG')
   * @param updates Teilweise Update-Objekt mit zu ändernden Feldern
   */
  private updateRaffstoresForFloor(floor: 'EG' | 'OG', updates: Partial<Raffstore>): void {
    const raffstores = this.raffstores$.value;
    const updated = raffstores.map(r =>
      r.floor === floor ? { ...r, ...updates } : r
    );
    this.raffstores$.next(updated);
  }

  /**
   * Konvertiere KNX-Wert (0-100) zu diskretem Schritt
   * @param type 'height' (0-3 Stufen) oder 'angle' (0-2 Stufen)
   * @param knxValue KNX Prozent-Wert (0-100)
   * @returns Diskrete Stufe mit Toleranz-Mapping
   */
  private knxToStep(type: 'height' | 'angle', knxValue: number): number {
    const mapping = type === 'height' ? KNX_TO_STEP.height : KNX_TO_STEP.angle;
    return (mapping as any)[knxValue] ?? 1;  // Default: 1/50%
  }

  /**
   * Error Handling für HTTP-Fehler
   * @param method Name der Methode, die fehlgeschlagen ist
   * @param context Kontext-Information (z.B. raffstoreId oder floor)
   * @param error Error-Objekt vom HTTP-Client
   * @returns Observable<never> - wirft Error für Subscriber
   */
  private handleError(method: string, context: string, error: any): Observable<never> {
    console.error(`[RaffstoreService] ✗ ${method} failed for ${context}:`, error);
    throw error;
  }
}
