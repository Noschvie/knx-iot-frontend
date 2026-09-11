import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
  Raffstore,
  RAFFSTORE_HEIGHT_STEP_UP,
  RAFFSTORE_HEIGHT_STEP_STOP,
  RAFFSTORE_HEIGHT_STEP_DOWN
} from '../models/raffstore.model';
import { RAFFSTORE_CONFIG, RAFFSTORE_COMMANDS, RAFFSTORE_DATAPOINT_KEYS, STEP_TO_KNX, RaffstoreDatapoints } from '../config/raffstore.config';
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
      this.config.gaAngle,
      this.config.gaStatusHeight,
      this.config.gaStatusAngle
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
            console.warn(`[RaffstoreService] ⚠️ Datapoint not found for GA ${ga}:`, err);
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

    console.log(`[RaffstoreService] setPosition called: height=${heightStep}, angle=${angleStep}, current.height=${current.heightStep}`);

    // Sende STOP-Befehl (DPST-1-7)
    if (heightStep === RAFFSTORE_HEIGHT_STEP_STOP) {
      console.log(`[RaffstoreService] Sending STOP command`);
      this.sendCommand(RAFFSTORE_DATAPOINT_KEYS.STEP, RAFFSTORE_COMMANDS.STOP).subscribe(
        () => {
          console.log(`[RaffstoreService] STOP command succeeded`);
          // STOP setzt isMoving sofort auf false - Raffstore stoppt
          const current = this.raffstore$.value;
          if (current && current.isMoving) {
            this.raffstore$.next({ ...current, isMoving: false });
            console.log(`[RaffstoreService] Movement stopped - UP/DOWN buttons are now enabled`);
          }
        },
        error => {
          console.error(`[RaffstoreService] STOP command failed:`, error);
          this.handleCommandError(error, current);
        }
      );
      return;
    }

    // Setze isMoving nur für UP/DOWN/Position-Befehle
    this.raffstore$.next({ ...current, isMoving: true });

    // ...existing code...
    // Timeout nach 1 Sekunde - Sicherheitsnetz falls API nicht antwortet
    const timeoutHandle = setTimeout(() => {
      const current = this.raffstore$.value;
      if (current && current.isMoving) {
        console.warn(`[RaffstoreService] ⚠️ Movement timeout after 1s - forcing reset of isMoving`);
        this.raffstore$.next({ ...current, isMoving: false });
      }
    }, 1000);

    const resetTimeout = () => clearTimeout(timeoutHandle);

    // Sende Zu-Befehl / Abwärts (DPT 1.008: MOVE_DOWN)
    if (heightStep === RAFFSTORE_HEIGHT_STEP_DOWN && current.heightStep > RAFFSTORE_HEIGHT_STEP_DOWN) {
      console.log(`[RaffstoreService] Sending MOVE_DOWN command`);
      this.sendCommand(RAFFSTORE_DATAPOINT_KEYS.MOVE, RAFFSTORE_COMMANDS.MOVE_DOWN).subscribe(
        () => {
          console.log(`[RaffstoreService] MOVE_DOWN command succeeded`);
          resetTimeout();
          this.updatePosition(heightStep, angleStep);
        },
        error => {
          console.error(`[RaffstoreService] MOVE_DOWN command failed:`, error);
          resetTimeout();
          this.handleCommandError(error, current);
        }
      );
    }
    // Sende Auf-Befehl / Aufwärts (DPT 1.008: MOVE_UP)
    else if (heightStep === RAFFSTORE_HEIGHT_STEP_UP && current.heightStep < RAFFSTORE_HEIGHT_STEP_UP) {
      console.log(`[RaffstoreService] Sending MOVE_UP command`);
      this.sendCommand(RAFFSTORE_DATAPOINT_KEYS.MOVE, RAFFSTORE_COMMANDS.MOVE_UP).subscribe(
        () => {
          console.log(`[RaffstoreService] MOVE_UP command succeeded`);
          resetTimeout();
          this.updatePosition(heightStep, angleStep);
        },
        error => {
          console.error(`[RaffstoreService] MOVE_UP command failed:`, error);
          resetTimeout();
          this.handleCommandError(error, current);
        }
      );
    }
    // Sende direkte Position
    else {
      const knxHeight = STEP_TO_KNX.height[heightStep as keyof typeof STEP_TO_KNX.height];
      const knxAngle = STEP_TO_KNX.angle[angleStep as keyof typeof STEP_TO_KNX.angle];
      console.log(`[RaffstoreService] Sending direct position: height=${knxHeight}, angle=${knxAngle}`);

      this.sendPosition(knxHeight, knxAngle).subscribe(
        () => {
          console.log(`[RaffstoreService] Direct position succeeded`);
          resetTimeout();
          this.updatePosition(heightStep, angleStep);
        },
        error => {
          console.error(`[RaffstoreService] Direct position failed:`, error);
          resetTimeout();
          this.handleCommandError(error, current);
        }
      );
    }
  }

  private sendCommand(gaKey: string, value: number | string): Observable<any> {
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
        attributes: { value: String(value) }
      }]
    };

    console.log(`[RaffstoreService] Sending command: ${value} to ${ga} (${uuid})`);

    return this.http.put(
      `${this.configService.getApiEndpoint()}/datapoints/values`,
      payload
    ).pipe(
      tap(response => console.log(`[RaffstoreService] ✅ Command sent: ${value}`, response)),
      catchError(err => {
        console.error(`[RaffstoreService] ✗ Command failed:`, err);
        throw err; // Re-throw so error callback is triggered
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
      tap(response => console.log(`[RaffstoreService] ✅ Position sent`, response)),
      catchError(err => {
        console.error(`[RaffstoreService] ✗ Position failed:`, err);
        throw err; // Re-throw so error callback is triggered
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
