import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Raffstore } from '../models/raffstore.model';
import { RAFFSTORE_CONFIG, STEP_TO_KNX, RaffstoreDatapoints } from '../config/raffstore.config';
import { ConfigService } from '@core/config/config.service';

interface DatapointUUID {
  ga: string;
  uuid: string;
}

@Injectable({ providedIn: 'root' })
export class RaffstoreService {
  private raffstore$ = new BehaviorSubject<Raffstore | null>(null);
  private datapointUUIDs = new Map<string, DatapointUUID>();
  private config: RaffstoreDatapoints | null = null;

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.initializeRaffstore();
  }

  private initializeRaffstore(): void {
    this.config = RAFFSTORE_CONFIG[0];

    this.loadDatapointUUIDs().subscribe(
      () => {
        console.log('[RaffstoreService] ✅ Datapoint UUIDs loaded');
        this.raffstore$.next({
          id: this.config!.id,
          label: this.config!.label,
          floor: this.config!.floor,
          orientation: this.config!.orientation,
          heightStep: 0,
          angleStep: 0,
          isMoving: false,
          autoMode: false
        });
      },
      error => {
        console.error('[RaffstoreService] ✗ Failed to load datapoint UUIDs:', error);
        this.raffstore$.next({
          id: this.config!.id,
          label: this.config!.label,
          floor: this.config!.floor,
          orientation: this.config!.orientation,
          heightStep: 0,
          angleStep: 0,
          isMoving: false,
          autoMode: false
        });
      }
    );
  }

  private loadDatapointUUIDs(): Observable<void> {
    if (!this.config) return of(void 0);

    const gaList = [
      this.config.gaMove,
      this.config.gaStep,
      this.config.gaHeight,
      this.config.gaAngle
    ];

    const requests = gaList.map(ga =>
      this.http.get<any>(`${this.configService.getApiEndpoint()}/datapoints?filter[ga]=${ga}`)
        .pipe(
          map(response => {
            const dp = response.data?.[0];
            if (dp) {
              this.datapointUUIDs.set(ga, { ga, uuid: dp.id });
              console.log(`[RaffstoreService] ✅ Found datapoint for GA ${ga}: ${dp.id}`);
            }
            return dp;
          }),
          catchError(err => {
            console.warn(`[RaffstoreService] ⚠️ Datapoint not found for GA ${ga}`);
            return of(null);
          })
        )
    );

    return forkJoin(requests).pipe(
      map(() => {}),
      catchError(() => of(void 0))
    );
  }

  getRaffstore(): Observable<Raffstore> {
    return this.raffstore$.asObservable().pipe(
      map(rs => rs || ({} as Raffstore))
    );
  }

  setPosition(heightStep: number, angleStep: number): void {
    if (!this.config) return;

    const current = this.raffstore$.value;
    if (!current) return;

    this.raffstore$.next({ ...current, isMoving: true });

    // Sende Auf-Befehl
    if (heightStep === 0 && current.heightStep > 0) {
      this.sendCommand('gaMove', 'up').subscribe(
        () => this.updatePosition(heightStep, angleStep),
        error => this.handleCommandError(error, current)
      );
    }
    // Sende Zu-Befehl
    else if (heightStep === 3 && current.heightStep < 3) {
      this.sendCommand('gaMove', 'down').subscribe(
        () => this.updatePosition(heightStep, angleStep),
        error => this.handleCommandError(error, current)
      );
    }
    // Sende direkte Position
    else {
      const knxHeight = STEP_TO_KNX.height[heightStep as keyof typeof STEP_TO_KNX.height];
      const knxAngle = STEP_TO_KNX.angle[angleStep as keyof typeof STEP_TO_KNX.angle];

      this.sendPosition(knxHeight, knxAngle).subscribe(
        () => this.updatePosition(heightStep, angleStep),
        error => this.handleCommandError(error, current)
      );
    }
  }

  private sendCommand(gaKey: string, value: string): Observable<any> {
    const ga = this.config?.[gaKey as keyof RaffstoreDatapoints] as string;
    const uuid = this.datapointUUIDs.get(ga)?.uuid;

    if (!uuid) {
      console.warn(`[RaffstoreService] ⚠️ Datapoint UUID not found for ${gaKey}`);
      return of(null);
    }

    const payload = {
      data: [{
        id: uuid,
        type: 'datapoint',
        attributes: { value }
      }]
    };

    console.log(`[RaffstoreService] Sending command: ${value} to ${ga} (${uuid})`);

    return this.http.put(
      `${this.configService.getApiEndpoint()}/datapoints/values`,
      payload
    ).pipe(
      tap(() => console.log(`[RaffstoreService] ✅ Command sent: ${value}`)),
      catchError(err => {
        console.error(`[RaffstoreService] ✗ Command failed:`, err);
        return of(null);
      })
    );
  }

  private sendPosition(heightValue: number, angleValue: number): Observable<any> {
    const gaHeight = this.config?.gaHeight;
    const gaAngle = this.config?.gaAngle;
    const uuidHeight = gaHeight ? this.datapointUUIDs.get(gaHeight)?.uuid : null;
    const uuidAngle = gaAngle ? this.datapointUUIDs.get(gaAngle)?.uuid : null;

    if (!uuidHeight || !uuidAngle) {
      console.warn('[RaffstoreService] ⚠️ Datapoint UUIDs not found');
      return of(null);
    }

    const payload = {
      data: [
        {
          id: uuidHeight,
          type: 'datapoint',
          attributes: { value: String(heightValue) }
        },
        {
          id: uuidAngle,
          type: 'datapoint',
          attributes: { value: String(angleValue) }
        }
      ]
    };

    console.log(`[RaffstoreService] Sending position: height=${heightValue}, angle=${angleValue}`);

    return this.http.put(
      `${this.configService.getApiEndpoint()}/datapoints/values`,
      payload
    ).pipe(
      tap(() => console.log(`[RaffstoreService] ✅ Position sent`)),
      catchError(err => {
        console.error(`[RaffstoreService] ✗ Position failed:`, err);
        return of(null);
      })
    );
  }

  private updatePosition(heightStep: number, angleStep: number): void {
    const current = this.raffstore$.value;
    if (!current) return;

    this.raffstore$.next({
      ...current,
      heightStep,
      angleStep,
      isMoving: false
    });
    console.log(`[RaffstoreService] Position updated: ${heightStep}/${angleStep}`);
  }

  private handleCommandError(error: any, previousState: Raffstore): void {
    console.error('[RaffstoreService] Command error:', error);
    this.raffstore$.next({ ...previousState, isMoving: false });
  }

  setAutoMode(enabled: boolean): void {
    const current = this.raffstore$.value;
    if (!current) return;
    this.raffstore$.next({ ...current, autoMode: enabled });
    console.log(`[RaffstoreService] Auto mode: ${enabled}`);
  }
}
