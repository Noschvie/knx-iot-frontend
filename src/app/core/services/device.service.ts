import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap, catchError, of } from 'rxjs';
import { ConfigService } from '../config/config.service';
import {
  DeviceResource,
  Device,
  JsonApiResponse,
  QueryOptions,
  buildQueryString
} from '@shared/models';

/**
 * DeviceService
 * Manage KNX devices and their relationships to datapoints/locations
 */
@Injectable({ providedIn: 'root' })
export class DeviceService {
  private apiBase: string = '';
  private devicesCache$ = new BehaviorSubject<Device[]>([]);

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.apiBase = this.configService.getApiBase();
  }

  /**
   * Get all devices
   * GET /api/v2/devices
   */
  getAll(options?: QueryOptions): Observable<Device[]> {
    const query = options ? buildQueryString(options) : 'page[limit]=100';
    const url = `${this.apiBase}/api/v2/devices?${query}`;

    return this.http.get<JsonApiResponse<DeviceResource[]>>(url).pipe(
      map(response => this.transformDevices(response.data as DeviceResource[])),
      tap(devices => this.devicesCache$.next(devices)),
      catchError(err => {
        console.error('Error fetching devices:', err);
        return of([]);
      })
    );
  }

  /**
   * Get single device
   * GET /api/v2/devices/:id
   */
  getById(id: string): Observable<Device | null> {
    const url = `${this.apiBase}/api/v2/devices/${encodeURIComponent(id)}`;

    return this.http.get<JsonApiResponse<DeviceResource>>(url).pipe(
      map(response => this.transformDevice(response.data as DeviceResource)),
      catchError(err => {
        console.error(`Error fetching device ${id}:`, err);
        return of(null);
      })
    );
  }

  /**
   * Get devices for a specific location
   * GET /api/v2/locations/:locationId/devices
   */
  getByLocation(locationId: string): Observable<Device[]> {
    const url = `${this.apiBase}/api/v2/locations/${encodeURIComponent(locationId)}/devices`;

    return this.http.get<JsonApiResponse<DeviceResource[]>>(url).pipe(
      map(response => this.transformDevices(response.data as DeviceResource[])),
      catchError(err => {
        console.error(`Error fetching devices for location ${locationId}:`, err);
        return of([]);
      })
    );
  }

  /**
   * Get devices cache observable
   */
  getDevicesList$(): Observable<Device[]> {
    return this.devicesCache$.asObservable();
  }

  // ========== PRIVATE HELPERS ==========

  private transformDevice(resource: DeviceResource): Device {
    return {
      id: resource.id,
      title: resource.attributes.title || 'Unknown',
      description: resource.attributes.description,

      manufacturer: resource.attributes.meta?.['knx:manufacturer'],
      product: resource.attributes.meta?.['knx:product'],
      serialNumber: resource.attributes.meta?.['knx:serialNumber'],
      physicalAddress: resource.attributes.physicalAddress,
      ipAddress: resource.attributes.ipAddress,

      status: (resource.attributes.status as any) || 'unknown',
      lastSeen: resource.attributes.lastSeen ? new Date(resource.attributes.lastSeen) : undefined,
      datapointCount: resource.attributes.datapointCount || 0,

      locationId: (resource.relationships?.location?.data as any)?.id,
      datapointIds: (resource.relationships?.datapoints?.data as any)?.map((d: any) => d.id)
    };
  }

  private transformDevices(resources: DeviceResource[]): Device[] {
    return (resources || []).map(r => this.transformDevice(r));
  }
}

