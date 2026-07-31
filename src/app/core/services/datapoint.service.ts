import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap, catchError, of } from 'rxjs';
import { ConfigService } from '../config/config.service';
import {
  DatapointResource,
  Datapoint,
  DatapointFilterCriteria,
  JsonApiResponse,
  QueryOptions,
  HistoryQueryParams,
  TimeSeriesQueryParams,
  TimeSeriesPoint,
  DatapointStats,
  buildQueryString
} from '@shared/models';

/**
 * DatapointService
 * Core service for Datapoint CRUD and real-time value operations
 *
 * API Endpoints:
 * - GET /api/v2/datapoints              List all datapoints (paginated)
 * - GET /api/v2/datapoints/:id          Get single datapoint
 * - GET /api/v2/datapoints/values       Get latest values
 * - GET /api/v2/datapoints/:id/history  Historical data
 * - GET /api/v2/datapoints/:id/timeseries  Time-series for charts
 * - PUT /api/v2/datapoints/values       Write values
 * - POST /api/v2/datapoints/:id/read    Request current value (manual read)
 */
@Injectable({ providedIn: 'root' })
export class DatapointService {
  private apiBase: string = '';

  // Cached data
  private datapointsCache$ = new BehaviorSubject<Datapoint[]>([]);
  private datapoint$ = new BehaviorSubject<Datapoint | null>(null);
  private lastValues$ = new BehaviorSubject<Map<string, string>>(new Map());

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.apiBase = this.configService.getApiBase();
  }

  /**
   * Get all datapoints with optional filtering and pagination
   * GET /api/v2/datapoints
   */
  getAll(options?: QueryOptions): Observable<Datapoint[]> {
    const query = options ? buildQueryString(options) : 'page[limit]=100';
    const url = `${this.apiBase}/api/v2/datapoints?${query}`;

    return this.http.get<JsonApiResponse<DatapointResource[]>>(url).pipe(
      map(response => this.transformDatapoints(response.data as DatapointResource[])),
      tap(datapoints => this.datapointsCache$.next(datapoints)),
      catchError(err => {
        console.error('Error fetching datapoints:', err);
        return of([]);
      })
    );
  }

  /**
   * Get a single datapoint by ID
   * GET /api/v2/datapoints/:id
   */
  getById(id: string): Observable<Datapoint | null> {
    const url = `${this.apiBase}/api/v2/datapoints/${encodeURIComponent(id)}`;

    return this.http.get<JsonApiResponse<DatapointResource>>(url).pipe(
      map(response => this.transformDatapoint(response.data as DatapointResource)),
      tap(dp => this.datapoint$.next(dp)),
      catchError(err => {
        console.error(`Error fetching datapoint ${id}:`, err);
        return of(null);
      })
    );
  }

  /**
   * Get latest values for multiple datapoints
   * GET /api/v2/datapoints/values
   *
   * Returns most recent value updates (sorted by -lastUpdated)
   */
  getLatestValues(limit: number = 100): Observable<Datapoint[]> {
    const query = buildQueryString({
      page: { limit },
      sort: '-lastUpdated'
    });
    const url = `${this.apiBase}/api/v2/datapoints/values?${query}`;

    return this.http.get<JsonApiResponse<DatapointResource[]>>(url).pipe(
      map(response => this.transformDatapoints(response.data as DatapointResource[])),
      tap(datapoints => {
        // Update cache for latest values
        const current = this.datapointsCache$.value;
        const idMap = new Map(current.map(d => [d.id, d]));
        datapoints.forEach(dp => idMap.set(dp.id, dp));
        this.datapointsCache$.next(Array.from(idMap.values()));
      }),
      catchError(err => {
        console.error('Error fetching latest values:', err);
        return of([]);
      })
    );
  }

  /**
   * Get historical data for a datapoint
   * GET /api/v2/datapoints/:id/history
   */
  getHistory(
    datapointId: string,
    params?: HistoryQueryParams
  ): Observable<any[]> {
    const query = params ? buildQueryString(params) : 'page[limit]=50&sort=-timestamp';
    const url = `${this.apiBase}/api/v2/datapoints/${encodeURIComponent(datapointId)}/history?${query}`;

    return this.http.get<JsonApiResponse>(url).pipe(
      map(response => response.data || []),
      catchError(err => {
        console.error(`Error fetching history for ${datapointId}:`, err);
        return of([]);
      })
    );
  }

  /**
   * Get time-series aggregated data (for charts)
   * GET /api/v2/datapoints/:id/timeseries
   */
  getTimeseries(
    datapointId: string,
    params?: TimeSeriesQueryParams
  ): Observable<TimeSeriesPoint[]> {
    const query = params ? buildQueryString(params) : 'aggregation=hourly&page[limit]=1000';
    const url = `${this.apiBase}/api/v2/datapoints/${encodeURIComponent(datapointId)}/timeseries?${query}`;

    return this.http.get<JsonApiResponse>(url).pipe(
      map(response => {
        const data = response.data;
        return Array.isArray(data) ? data : [data];
      }),
      catchError(err => {
        console.error(`Error fetching timeseries for ${datapointId}:`, err);
        return of([]);
      })
    );
  }

  /**
   * Write value(s) to datapoint(s)
   * PUT /api/v2/datapoints/values
   *
   * Example:
   * {
   *   "data": [
   *     { "type": "datapoint", "id": "1/2/3", "attributes": { "value": "50" } }
   *   ]
   * }
   */
  writeValues(updates: Array<{ id: string; value: string }>): Observable<any> {
    const payload = {
      data: updates.map(update => ({
        type: 'datapoint',
        id: update.id,
        attributes: { value: update.value }
      }))
    };

    const url = `${this.apiBase}/api/v2/datapoints/values`;
    return this.http.put<JsonApiResponse>(url, payload).pipe(
      tap(() => {
        // Update local cache
        updates.forEach(({ id, value }) => {
          const currentMap = this.lastValues$.value;
          currentMap.set(id, value);
          this.lastValues$.next(currentMap);
        });
      }),
      catchError(err => {
        console.error('Error writing datapoint values:', err);
        throw err;
      })
    );
  }

  /**
   * Manually request current value from datapoint (read)
   * POST /api/v2/datapoints/:id/read
   */
  readValue(datapointId: string): Observable<Datapoint | null> {
    const url = `${this.apiBase}/api/v2/datapoints/${encodeURIComponent(datapointId)}/read`;

    return this.http.post<JsonApiResponse<DatapointResource>>(url, {}).pipe(
      map(response => this.transformDatapoint(response.data as DatapointResource)),
      catchError(err => {
        console.error(`Error reading datapoint ${datapointId}:`, err);
        return of(null);
      })
    );
  }

  /**
   * Get statistics for a datapoint
   * GET /api/v2/datapoints/:id/stats
   */
  getStats(datapointId: string): Observable<DatapointStats | null> {
    const url = `${this.apiBase}/api/v2/datapoints/${encodeURIComponent(datapointId)}/stats`;

    return this.http.get<any>(url).pipe(
      catchError(err => {
        console.error(`Error fetching stats for ${datapointId}:`, err);
        return of(null);
      })
    );
  }

  /**
   * Observable for cached datapoints
   */
  getDatapointsList$(): Observable<Datapoint[]> {
    return this.datapointsCache$.asObservable();
  }

  /**
   * Observable for current selected datapoint
   */
  getDatapoint$(): Observable<Datapoint | null> {
    return this.datapoint$.asObservable();
  }

  /**
   * Observable for last known values map
   */
  getLastValues$(): Observable<Map<string, string>> {
    return this.lastValues$.asObservable();
  }

  // ========== PRIVATE HELPERS ==========

  /**
   * Transform JSON:API resource to flat DTO
   */
  private transformDatapoint(resource: DatapointResource): Datapoint {
    return {
      id: resource.id,
      title: resource.attributes.title || 'Unknown',
      description: resource.attributes.description,
      value: resource.attributes.value,
      valueRaw: resource.attributes.valueRaw,
      lastUpdated: resource.attributes.lastUpdated ? new Date(resource.attributes.lastUpdated) : undefined,
      dptType: resource.attributes.meta?.['@type'],
      unit: resource.attributes.meta?.['@unit'],

      deviceId: (resource.relationships?.device?.data as any)?.id,
      locationId: (resource.relationships?.location?.data as any)?.id,
      functionId: (resource.relationships?.function?.data as any)?.id,

      readable: resource.attributes.readable ?? true,
      writable: resource.attributes.writable ?? false,
      qualityValid: resource.attributes.qualityValid ?? true
    };
  }

  /**
   * Transform array of JSON:API resources
   */
  private transformDatapoints(resources: DatapointResource[]): Datapoint[] {
    return (resources || []).map(r => this.transformDatapoint(r));
  }
}

