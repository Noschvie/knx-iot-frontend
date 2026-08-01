import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap, catchError, of } from 'rxjs';
import { ConfigService } from '../config/config.service';
import {
  LocationResource,
  Location,
  JsonApiResponse,
  QueryOptions,
  buildQueryString
} from '@shared/models';

/**
 * LocationService
 * Manage location hierarchy (Building > Floor > Room > Zone)
 */
@Injectable({ providedIn: 'root' })
export class LocationService {
  private apiEndpoint: string = '';
  private locationsCache$ = new BehaviorSubject<Location[]>([]);

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.apiEndpoint = this.configService.getApiEndpoint();
  }

  /**
   * Get all locations
   * GET /locations
   */
  getAll(options?: QueryOptions): Observable<Location[]> {
    const query = options ? buildQueryString(options) : 'page[limit]=100';
    const url = `${this.apiEndpoint}/locations?${query}`;
    console.log('[Location Service] Fetching locations:', url);

    return this.http.get<JsonApiResponse<LocationResource[]>>(url).pipe(
      map(response => {
        console.log('[Location Service] Response received, transforming data...');
        return this.transformLocations(response.data as LocationResource[]);
      }),
      tap(locations => {
        console.log(`[Location Service] ✓ Locations retrieved: ${locations.length} locations`);
        this.locationsCache$.next(locations);
      }),
      catchError(err => {
        console.error('[Location Service] ✗ Error fetching locations:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          url: url
        });
        return of([]);
      })
    );
  }

  /**
   * Get a single location
   * GET /locations/:id
   */
  getById(id: string): Observable<Location | null> {
    const url = `${this.apiEndpoint}/locations/${encodeURIComponent(id)}`;

    return this.http.get<JsonApiResponse<LocationResource>>(url).pipe(
      map(response => this.transformLocation(response.data as LocationResource)),
      catchError(err => {
        console.error(`Error fetching location ${id}:`, err);
        return of(null);
      })
    );
  }

  /**
   * Get parent location
   * Get via location's parent relationship
   * (Direct endpoint not specified in KNX IoT API, use relationship)
   */
  getParent(locationId: string): Observable<Location | null> {
    return this.getById(locationId).pipe(
      map(location => {
        // Parent location ID would be in the relationship
        // This is a simplified version - actual parent fetch requires relationship resolution
        return null;
      }),
      catchError(_err => of(null))
    );
  }

  /**
   * Get child locations
   * GET /locations/:id/childlocations
   */
  getChildren(locationId: string): Observable<Location[]> {
    const url = `${this.apiEndpoint}/locations/${encodeURIComponent(locationId)}/childlocations`;

    return this.http.get<JsonApiResponse<LocationResource[]>>(url).pipe(
      map(response => this.transformLocations(response.data as LocationResource[])),
      catchError(_err => of([]))
    );
  }

  /**
   * Get locations cache observable
   */
  getLocationsList$(): Observable<Location[]> {
    return this.locationsCache$.asObservable();
  }

  // ========== PRIVATE HELPERS ==========

  private transformLocation(resource: LocationResource): Location {
    return {
      id: resource.id,
      title: resource.attributes.title || 'Unknown',
      description: resource.attributes.description,
      locationType: resource.attributes.type,

      parentLocationId: (resource.relationships?.parentLocation?.data as any)?.id,
      childLocationIds: (resource.relationships?.childLocations?.data as any)?.map((l: any) => l.id),
      deviceIds: (resource.relationships?.devices?.data as any)?.map((d: any) => d.id),
      datapointIds: (resource.relationships?.datapoints?.data as any)?.map((d: any) => d.id)
    };
  }

  private transformLocations(resources: LocationResource[]): Location[] {
    return (resources || []).map(r => this.transformLocation(r));
  }
}
