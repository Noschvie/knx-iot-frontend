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
  private apiBase: string = '';
  private locationsCache$ = new BehaviorSubject<Location[]>([]);

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.apiBase = this.configService.getApiBase();
  }

  /**
   * Get all locations
   * GET /api/v2/locations
   */
  getAll(options?: QueryOptions): Observable<Location[]> {
    const query = options ? buildQueryString(options) : 'page[limit]=100';
    const url = `${this.apiBase}/api/v2/locations?${query}`;

    return this.http.get<JsonApiResponse<LocationResource[]>>(url).pipe(
      map(response => this.transformLocations(response.data as LocationResource[])),
      tap(locations => this.locationsCache$.next(locations)),
      catchError(err => {
        console.error('Error fetching locations:', err);
        return of([]);
      })
    );
  }

  /**
   * Get single location
   * GET /api/v2/locations/:id
   */
  getById(id: string): Observable<Location | null> {
    const url = `${this.apiBase}/api/v2/locations/${encodeURIComponent(id)}`;

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
   * GET /api/v2/locations/:id/parentlocation
   */
  getParent(locationId: string): Observable<Location | null> {
    const url = `${this.apiBase}/api/v2/locations/${encodeURIComponent(locationId)}/parentlocation`;

    return this.http.get<JsonApiResponse<LocationResource>>(url).pipe(
      map(response => this.transformLocation(response.data as LocationResource)),
      catchError(err => of(null))
    );
  }

  /**
   * Get child locations
   * GET /api/v2/locations/:id/childlocations
   */
  getChildren(locationId: string): Observable<Location[]> {
    const url = `${this.apiBase}/api/v2/locations/${encodeURIComponent(locationId)}/childlocations`;

    return this.http.get<JsonApiResponse<LocationResource[]>>(url).pipe(
      map(response => this.transformLocations(response.data as LocationResource[])),
      catchError(err => of([]))
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

