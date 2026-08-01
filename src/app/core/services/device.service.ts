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
  private apiEndpoint: string = '';
  private devicesCache$ = new BehaviorSubject<Device[]>([]);

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.apiEndpoint = this.configService.getApiEndpoint();
  }

  /**
   * Get all devices
   * GET /devices
   */
  getAll(options?: QueryOptions): Observable<Device[]> {
    const query = options ? buildQueryString(options) : 'page[limit]=100';
    const url = `${this.apiEndpoint}/devices?${query}`;
    console.log('[Device Service] Fetching devices:', url);

    return this.http.get<JsonApiResponse<DeviceResource[]>>(url).pipe(
      map(response => {
        console.log('[Device Service] Response received, transforming data...');
        return this.transformDevices(response.data as DeviceResource[]);
      }),
      tap(devices => {
        console.log(`[Device Service] ✓ Devices retrieved: ${devices.length} devices`);
        this.devicesCache$.next(devices);
      }),
      catchError(err => {
        console.error('[Device Service] ✗ Error fetching devices:', {
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
   * Get a single device
   * GET /devices/:id
   */
  getById(id: string): Observable<Device | null> {
    const url = `${this.apiEndpoint}/devices/${encodeURIComponent(id)}`;

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
   * GET /locations/{locationId}/children/{deviceId}
   * or filter via: GET /devices?filter[location]={locationId}
   */
  getByLocation(locationId: string): Observable<Device[]> {
    const query = buildQueryString({
      filter: { location: locationId }
    });
    const url = `${this.apiEndpoint}/devices?${query}`;

    return this.http.get<JsonApiResponse<DeviceResource[]>>(url).pipe(
      map(response => this.transformDevices(response.data as DeviceResource[])),
      catchError(err => {
        console.error(`Error fetching devices for location ${locationId}:`, err);
        return of([]);
      })
    );
  }

  /**
   * Get device cache observable
   */
  getDevicesList$(): Observable<Device[]> {
    return this.devicesCache$.asObservable();
  }

  // ========== PRIVATE HELPERS ==========

  private transformDevice(resource: DeviceResource): Device {
    const datapointsData = resource.relationships?.datapoints?.data;

    // Manufacturer kann in zwei Orten sein: direkt in attributes ODER in meta
    const manufacturer = (resource.attributes as any).manufacturer ||
        (resource.attributes.meta?.['knx:manufacturer']);
    const product = (resource.attributes as any).product ||
        (resource.attributes.meta?.['knx:product']);
    const serialNumber = (resource.attributes as any).serialNumber ||
        resource.attributes.meta?.['knx:serialNumber'];
    const physicalAddress = (resource.attributes as any).physicalAddress ||
        resource.attributes.meta?.['knx:physicalAddress'];

    return {
      id: resource.id,
      title: resource.attributes.title || 'Unknown',
      description: resource.attributes.description,

      manufacturer: manufacturer,
      product: product,
      serialNumber: serialNumber,
      physicalAddress: physicalAddress,

      status: (resource.attributes as any).status || 'unknown',
      lastSeen: resource.attributes.lastSeen ? new Date(resource.attributes.lastSeen) : undefined,
      datapointCount: resource.attributes.datapointCount || 0,

      locationId: (resource.relationships?.location?.data as any)?.id,
      datapointIds: Array.isArray(datapointsData)
        ? datapointsData.map((d: any) => d.id)
        : datapointsData ? [(datapointsData as any).id] : []
    };
  }

  private transformDevices(resources: DeviceResource[]): Device[] {
    console.log('[Device Service] Transforming resources:', resources?.length || 0);
    const result = (resources || []).map(r => {
      const transformed = this.transformDevice(r);
      console.log('[Device Service] Transformed device:', {
        title: transformed.title,
        manufacturer: transformed.manufacturer,
        address: transformed.physicalAddress,
        status: transformed.status
      });
      return transformed;
    });
    console.log('[Device Service] Transformation complete. Total:', result.length);
    return result;
  }
}
