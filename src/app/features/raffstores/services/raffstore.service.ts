import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '@core/config/config.service';
import { Raffstore, Favorite, HEIGHT_STEP_UP, HEIGHT_STEP_DOWN } from '../models/raffstore.model';
import { RAFFSTORE_CONFIG, RaffstoreDatapoints } from '../config/raffstore.config';
import { map, tap, catchError } from 'rxjs/operators';
import { DatapointService } from '@core/services/datapoint.service';
import { Datapoint } from '@shared/models';

interface RaffstoreConfigFile {
  raffstores: RaffstoreDatapoints[];
}

/**
 * DPT 5.001 Mapping: Discrete steps (0-3 for height, 0-2 for an angle) ↔ KNX percent (0-100)
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
  private readonly datapointApi = inject(DatapointService);
  private raffstores$ = new BehaviorSubject<Raffstore[]>([]);
  private selectedRaffstoreId$ = new BehaviorSubject<string | null>(null);

  // Cache: GA → komplettes Datapoint-Objekt (mit ID, title, type, etc.)
  private datapointsCache = new Map<string, Datapoint>();

  private apiEndpoint: string = '';
  private raffstoreConfig: RaffstoreDatapoints[] = RAFFSTORE_CONFIG; // Fallback to hardcoded config

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
    this.apiEndpoint = this.configService.getApiEndpoint();
    this.initializeRaffstores();
  }

  /**
   * Initialize raffstores from the config file (JSON) or fallback to hardcoded config
   * Called by service constructor
   * @private
   */
  private initializeRaffstores(): void {
    console.log('[RaffstoreService] Initializing raffstores');

    // Try to load config from JSON file
    this.loadConfigFromFile().subscribe({
      next: (config) => {
        this.raffstoreConfig = config;
        this.initializeFromConfig();
      },
      error: (err) => {
        console.warn('[RaffstoreService] Failed to load config from file, using fallback:', err);
        // Fallback to hardcoded config
        this.raffstoreConfig = RAFFSTORE_CONFIG;
        this.initializeFromConfig();
      }
    });
  }

  /**
   * Load raffstore configuration from BFF endpoint
   * @private
   */
  private loadConfigFromFile(): Observable<RaffstoreDatapoints[]> {
    return this.http.get<any>(`${this.apiEndpoint}/config/raffstore`).pipe(
      map(response => response.data.raffstores),
      tap(() => console.log('[RaffstoreService] Successfully loaded config from BFF'))
    );
  }

  /**
   * Initialize raffstore data from a loaded config
   * @private
   */
  private initializeFromConfig(): void {
    // 1. Convert config to a raffstore array
    const raffstores = this.mapConfigToRaffstores(this.raffstoreConfig);

    this.raffstores$.next(raffstores);
    console.log(`[RaffstoreService] Loaded ${raffstores.length} raffstores`);

    // 2. Extract all GAs from config
    const allGAs = Array.from(this.extractAllGAsFromConfig(this.raffstoreConfig));
    console.log(`[RaffstoreService] Found ${allGAs.length} group addresses`);

    // 3. Request datapoint IDs from semantic-knx-gateway
    this.initializeDatapoints(allGAs);

    // 4. Done
    this.datapointApi.logCache(); // Debug: Print cache
    console.log('[RaffstoreService] Initialization complete');
  }

  /**
   * Convert config to a raffstore array
   */
  private mapConfigToRaffstores(config: any[]): Raffstore[] {
    return config.map((cfg) => ({
      id: cfg.id,
      name: cfg.name,
      floor: cfg.floor,
      orientation: cfg.orientation,
      heightStep: 1, // Default
      angleStep: 0,  // Default
      autoMode: false,
      isMoving: false
    })) as any;
  }

  /**
   * Get an observable stream of all raffstores
   * @returns Observable a containing array of all raffstores (initialized from RAFFSTORE_CONFIG)
   */
  getRaffstores(): Observable<Raffstore[]> {
    return this.raffstores$.asObservable();
  }

  /**
   * Get observable stream for selected raffstore
   * @returns Observable containing a raffstore or null if nothing is selected
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
   * Select a raffstore (for detail view)
   * @param id ID of raffstore to select
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
   * Move up command (DPT 1.008 MOVE_UP = 0)
   * Write to 2/1/x (gaMove)
   * @param raffstoreId ID of raffstore (e.g. 'rs-1')
   * @returns Observable<void> command was sent
   */
  moveUp(raffstoreId: string): Observable<void> {
    const config = this.getConfig(raffstoreId);
    const datapointId = this.getDatapointIdOrThrow(config.gaMove, 'gaMove');

    console.log(`[RaffstoreService] moveUp - DatapointID: ${datapointId}`);

    const payload = {
      data: [{
        type: 'datapoint',
        id: datapointId,
        attributes: { value: '0' }  // DPT 1.008: 0 = Up
      }]
    };

    return this.http.put<any>(`${this.apiEndpoint}/datapoints/values`, payload).pipe(
      tap(() => {
        this.updateRaffstoreInList(raffstoreId, { heightStep: HEIGHT_STEP_UP, isMoving: true });
        console.log(`[RaffstoreService] Move UP sent: ${raffstoreId}`);
      }),
      map(() => void 0),
      catchError(err => this.handleError('moveUp', raffstoreId, err))
    );
  }

  /**
   * Move down command (DPT 1.008 MOVE_DOWN = 1)
   * Write to 2/1/x (gaMove)
   * @param raffstoreId ID of raffstore (e.g. 'rs-1')
   * @returns Observable<void> command was sent
   */
  moveDown(raffstoreId: string): Observable<void> {
    const config = this.getConfig(raffstoreId);
    const datapointId = this.getDatapointIdOrThrow(config.gaMove, 'gaMove');

    console.log(`[RaffstoreService] moveDown - DatapointID: ${datapointId}`);

    const payload = {
      data: [{
        type: 'datapoint',
        id: datapointId,
        attributes: { value: '1' }  // DPT 1.008: 1 = Down
      }]
    };

    return this.http.put<any>(`${this.apiEndpoint}/datapoints/values`, payload).pipe(
      tap(() => {
        this.updateRaffstoreInList(raffstoreId, { heightStep: HEIGHT_STEP_DOWN, isMoving: true });
        console.log(`[RaffstoreService] Move DOWN sent: ${raffstoreId}`);
      }),
      map(() => void 0),
      catchError(err => this.handleError('moveDown', raffstoreId, err))
    );
  }

  /**
   * Stop command (DPT 1.007 STEP = 1)
   * Write to 2/2/x (gaStep)
   * @param raffstoreId ID of raffstore (e.g. 'rs-1')
   * @returns Observable<void> command was sent
   */
  moveStop(raffstoreId: string): Observable<void> {
    const config = this.getConfig(raffstoreId);
    const datapointId = this.getDatapointIdOrThrow(config.gaStep, 'gaStep');

    console.log(`[RaffstoreService] moveStop - DatapointID: ${datapointId}`);

    const payload = {
      data: [{
        type: 'datapoint',
        id: datapointId,
        attributes: { value: '1' }  // DPT 1.007: Step/Stop
      }]
    };

    return this.http.put<any>(`${this.apiEndpoint}/datapoints/values`, payload).pipe(
      tap(() => {
        this.updateRaffstoreInList(raffstoreId, { isMoving: false });
        console.log(`[RaffstoreService] Move STOP sent: ${raffstoreId}`);
      }),
      map(() => void 0),
      catchError(err => this.handleError('moveStop', raffstoreId, err))
    );
  }

  /**
   * Set height: Write DPT 5.001 (0-100) to 2/3/x (gaPositionSet)
   * @param raffstoreId ID of raffstore (e.g. 'rs-1')
   * @param step 0-3 → converted to 0-100 (Up → 1/3 → 2/3 → Down)
   */
  setHeight(raffstoreId: string, step: number): Observable<void> {
    const config = this.getConfig(raffstoreId);
    const knxValue = (STEP_TO_KNX.height as any)[step] ?? 0;
    const datapointId = this.getDatapointIdOrThrow(config.gaPositionSet, 'gaPositionSet');

    console.log(`[RaffstoreService] setHeight - DatapointID: ${datapointId}, value: ${knxValue}`);

    const payload = {
      data: [{
        type: 'datapoint',
        id: datapointId,
        attributes: { value: knxValue.toString() }  // DPT 5.001: 0-100
      }]
    };

    return this.http.put<any>(`${this.apiEndpoint}/datapoints/values`, payload).pipe(
      tap(() => {
        this.updateRaffstoreInList(raffstoreId, { heightStep: step });
        console.log(`[RaffstoreService] Height set: ${raffstoreId} → ${step} (${knxValue}%)`);
      }),
      map(() => void 0),
      catchError(err => this.handleError('setHeight', raffstoreId, err))
    );
  }

  /**
   * Set lamella angle: Write DPT 5.001 (0-100) to 2/4/x (gaLamellasSet)
   * @param raffstoreId ID of raffstore (e.g. 'rs-1')
   * @param step 0-2 → converted to 0-100 (Open → Diagonal → Closed)
   */
  setAngle(raffstoreId: string, step: number): Observable<void> {
    const config = this.getConfig(raffstoreId);
    const knxValue = (STEP_TO_KNX.angle as any)[step] ?? 0;
    const datapointId = this.getDatapointIdOrThrow(config.gaLamellasSet, 'gaLamellasSet');

    console.log(`[RaffstoreService] setAngle - DatapointID: ${datapointId}, value: ${knxValue}`);

    const payload = {
      data: [{
        type: 'datapoint',
        id: datapointId,
        attributes: { value: knxValue.toString() }  // DPT 5.001: 0-100
      }]
    };

    return this.http.put<any>(`${this.apiEndpoint}/datapoints/values`, payload).pipe(
      tap(() => {
        this.updateRaffstoreInList(raffstoreId, { angleStep: step });
        console.log(`[RaffstoreService] Angle set: ${raffstoreId} → ${step} (${knxValue}%)`);
      }),
      map(() => void 0),
      catchError(err => this.handleError('setAngle', raffstoreId, err))
    );
  }

  /**
   * Set position (height + angle)
   * Write to 2/3/x and 2/4/x (gaPositionSet and gaLamellasSet)
   * @param raffstoreId ID of raffstore (e.g. 'rs-1')
   * @param heightStep 0-3 (Up → 1/3 → 2/3 → Down)
   * @param angleStep 0-2 (Open → Diagonal → Closed)
   * @returns Observable<void> command was sent
   */
  setPosition(raffstoreId: string, heightStep: number, angleStep: number): Observable<void> {
    const config = this.getConfig(raffstoreId);
    const heightValue = (STEP_TO_KNX.height as any)[heightStep];
    const angleValue = (STEP_TO_KNX.angle as any)[angleStep];

    const heightDatapointId = this.getDatapointIdOrThrow(config.gaPositionSet, 'gaPositionSet');
    const angleDatapointId = this.getDatapointIdOrThrow(config.gaLamellasSet, 'gaLamellasSet');

    console.log(`[RaffstoreService] setPosition - Height ID: ${heightDatapointId}, Angle ID: ${angleDatapointId}`);

    const payload = {
      data: [
        {
          type: 'datapoint',
          id: heightDatapointId,
          attributes: { value: heightValue.toString() }
        },
        {
          type: 'datapoint',
          id: angleDatapointId,
          attributes: { value: angleValue.toString() }
        }
      ]
    };

    return this.http.put<any>(`${this.apiEndpoint}/datapoints/values`, payload).pipe(
      tap(() => {
        this.updateRaffstoreInList(raffstoreId, { heightStep, angleStep });
        console.log(`[RaffstoreService] Position set: ${raffstoreId} → height=${heightStep} (${heightValue}%), angle=${angleStep} (${angleValue}%)`);
      }),
      map(() => void 0),
      catchError(err => this.handleError('setPosition', raffstoreId, err))
    );
  }

  /**
   * Group command: All raffstores of a floor
   * Write to all 2/1/x (gaMove) for this floor
   * @param floor Floor ('EG' = first floor or 'OG' = upper floor)
   * @param command Movement direction ('up' = upward, 'down' = downward)
   * @returns Observable<void> command was sent
   */
  groupCommand(floor: 'EG' | 'OG', command: 'up' | 'down'): Observable<void> {
    const knxValue = command === 'up' ? '0' : '1';  // DPT 1.008
    const raffstoredForFloor = this.raffstoreConfig.filter(c => c.floor === floor);

    const payload = {
      data: raffstoredForFloor.map(config => {
        const datapointId = this.getDatapointIdOrThrow(config.gaMove, 'gaMove');
        console.log(`[RaffstoreService] groupCommand - DatapointID: ${datapointId}`);

        return {
          type: 'datapoint',
          id: datapointId,
          attributes: { value: knxValue }
        };
      })
    };

    return this.http.put<any>(`${this.apiEndpoint}/datapoints/values`, payload).pipe(
      tap(() => {
        const heightStep = command === 'up' ? HEIGHT_STEP_UP : HEIGHT_STEP_DOWN;
        this.updateRaffstoresForFloor(floor, { heightStep, isMoving: false });
        console.log(`[RaffstoreService] Group command sent: ${floor} ${command}`);
      }),
      map(() => void 0),
      catchError(err => this.handleError('groupCommand', floor, err))
    );
  }

  /**
   * Apply favorite
   * @param raffstoreId ID of raffstore (e.g. 'rs-1')
   * @param favorite Favorite object with height and angle step
   * @returns Observable<void> position was set
   */
  applyFavorite(raffstoreId: string, favorite: Favorite): Observable<void> {
    return this.setPosition(raffstoreId, favorite.heightStep, favorite.angleStep);
  }

  /**
   * Toggle automation mode (write to 2/7/x - gaLock)
   * @param raffstoreId ID of raffstore (e.g. 'rs-1')
   * @returns Observable<void> command was sent
   */
  toggleAutoMode(raffstoreId: string): Observable<void> {
    const config = this.getConfig(raffstoreId);
    const raffstore = this.raffstores$.value.find(r => r.id === raffstoreId);
    const newValue = raffstore?.autoMode ? '1' : '0';  // 0=released (manual), 1=locked (auto)
    const datapointId = this.getDatapointIdOrThrow(config.gaLock, 'gaLock');

    console.log(`[RaffstoreService] toggleAutoMode - DatapointID: ${datapointId}, value: ${newValue}`);

    const payload = {
      data: [{
        type: 'datapoint',
        id: datapointId,
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
   * Load current status values from backend
   * Reads 2/5/x (gaStatusPosition) and 2/6/x (gaStatusLamellas)
   * @param raffstoreId ID of raffstore (e.g. 'rs-1')
   * @returns Observable with height and angle steps
   */
  loadCurrentStatus(raffstoreId: string): Observable<{ heightStep: number; angleStep: number }> {
    const config = this.getConfig(raffstoreId);

    return forkJoin([
      this.http.get<any>(`${this.apiEndpoint}/datapoints/${encodeURIComponent(config.gaStatusPosition)}`),
      this.http.get<any>(`${this.apiEndpoint}/datapoints/${encodeURIComponent(config.gaStatusLamellas)}`)
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
   * Get favorites for a floor
   * @param floor Floor ('EG' or 'OG')
   * @returns Array of favorites for the floor
   */
  getFavorites(floor: 'EG' | 'OG'): Favorite[] {
    return this.favorites[floor];
  }

  // ========== PRIVATE HELPERS ==========

  /**
   * Get config for a raffstore ID
   * @param raffstoreId ID of raffstore
   * @returns Config object or throws error if not found
   */
  private getConfig(raffstoreId: string): RaffstoreDatapoints {
    const config = this.raffstoreConfig.find(c => c.id === raffstoreId);
    if (!config) {
      throw new Error(`[RaffstoreService] Config not found for raffstore: ${raffstoreId}`);
    }
    return config;
  }

  /**
   * Get Datapoint UUID from cache or throw error if not found
   * @param ga Group Address (e.g., "2/1/1")
   * @param gaName Friendly name (e.g., "gaMove")
   * @returns Datapoint UUID from cache
   * @throws Error if datapoint not loaded
   */
  private getDatapointIdOrThrow(ga: string, gaName: string): string {
    const datapoint = this.datapointsCache.get(ga);
    if (!datapoint?.id) {
      throw new Error(`[RaffstoreService] Datapoint NOT FOUND for ${gaName} (GA: ${ga}). Cache not initialized!`);
    }
    return datapoint.id;
  }

  /**
   * Update a single raffstore in the list
   * @param raffstoreId ID of raffstore
   * @param updates Partial update object with fields to change
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
   * Update all raffstores of a floor
   * @param floor Floor ('EG' or 'OG')
   * @param updates Partial update object with fields to change
   */
  private updateRaffstoresForFloor(floor: 'EG' | 'OG', updates: Partial<Raffstore>): void {
    const raffstores = this.raffstores$.value;
    const updated = raffstores.map(r =>
      r.floor === floor ? { ...r, ...updates } : r
    );
    this.raffstores$.next(updated);
  }

  /**
   * Convert KNX value (0-100) to discrete step
   * @param type 'height' (0-3 steps) or 'angle' (0-2 steps)
   * @param knxValue KNX percent value (0-100)
   * @returns Discrete step with tolerance mapping
   */
  private knxToStep(type: 'height' | 'angle', knxValue: number): number {
    const mapping = type === 'height' ? KNX_TO_STEP.height : KNX_TO_STEP.angle;
    return (mapping as any)[knxValue] ?? 1;  // Default: 1/50%
  }

  /**
   * Error handling for HTTP errors
   * @param method Name of the method that failed
   * @param context Context information (e.g. raffstoreId or floor)
   * @param error Error object from HTTP client
   * @returns Observable<never> - throws error to subscriber
   */
  private handleError(method: string, context: string, error: any): Observable<never> {
    console.error(`[RaffstoreService] ✗ ${method} failed for ${context}:`, error);
    throw error;
  }

  /**
   * Extract all group addresses from the configuration
   * Collects all GA properties from raffstore config objects
   * @param raffstores Array of raffstore config objects
   * @returns Set of unique group addresses
   */
  private extractAllGAsFromConfig(raffstores: any[]): Set<string> {
    const allGAs = new Set<string>();

    raffstores.forEach(rs => {
      allGAs.add(rs.gaMove);
      allGAs.add(rs.gaStep);
      allGAs.add(rs.gaPositionSet);
      allGAs.add(rs.gaLamellasSet);
      allGAs.add(rs.gaStatusPosition);
      allGAs.add(rs.gaStatusLamellas);
      allGAs.add(rs.gaLock);
      allGAs.add(rs.gaEndTop);
      allGAs.add(rs.gaEndBottom);
    });

    return allGAs;
  }

  /**
   * Initialize datapoint cache from backend
   * Loads all datapoints for group addresses and stores complete objects
   * @param gasToLoad Array of group addresses to load
   */
  private async initializeDatapoints(gasToLoad: string[]): Promise<void> {
    console.log(`[RaffstoreService] Initializing ${gasToLoad.length} datapoints`);
    let successCount = 0;

    for (const ga of gasToLoad) {
      try {
        const datapoint = await firstValueFrom(this.datapointApi.getById(ga));
        if (datapoint) {
          // Store complete Datapoint object in cache: GA → Datapoint
          this.datapointsCache.set(ga, datapoint);
          successCount++;
          console.log(`[RaffstoreService] [OK] Loaded: GA=${ga}, ID=${datapoint.id}, Title=${datapoint.title}`);
        } else {
          console.warn(`[RaffstoreService] [!] NOT FOUND: GA=${ga}`);
        }
      } catch (error) {
        console.error(`[RaffstoreService] Error loading GA=${ga}:`, error);
      }
    }

    console.log(`[RaffstoreService] [OK] Datapoint cache loaded: ${successCount}/${gasToLoad.length}`);
  }

  /**
   * Get cached datapoint by GA
   * @param ga Group Address (e.g., "2/1/1")
   * @returns Cached Datapoint object or undefined
   */
  getDatapointByGA(ga: string): Datapoint | undefined {
    return this.datapointsCache.get(ga);
  }

  /**
   * DEBUG: Log current cache state
   */
  debugLogCache(): void {
    console.log('[RaffstoreService] DEBUG CACHE STATE:', {
      raffstoresCount: this.raffstores$.value.length,
      datapointsCacheCount: this.datapointsCache.size,
      raffstoreConfig: this.raffstoreConfig.slice(0, 2)
    });

    // Show cached datapoints with details
    console.log('[RaffstoreService] Cached Datapoints:', Array.from(this.datapointsCache.entries()).map(([ga, dp]) => ({
      ga,
      id: dp.id,
      title: dp.title,
      type: dp.dptType
    })));
  }
}
