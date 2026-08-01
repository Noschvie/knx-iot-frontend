import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Datapoint } from '@shared/models';

/**
 * LiveBufferService
 * Maintains a sliding window of recent datapoint values (client-side)
 * - Stores up to 1000 most recent updates
 * - Updates are newest-first
 * - Emits when buffer changes
 */
@Injectable({ providedIn: 'root' })
export class LiveBufferService {
  private buffer: Datapoint[] = [];
  private maxSize = 1000;

  private bufferUpdated$ = new BehaviorSubject<Datapoint[]>([]);
  private messageCount$ = new BehaviorSubject<number>(0);
  private isConnected$ = new BehaviorSubject<boolean>(false);

  constructor() {}

  /**
   * Add a value to the buffer (newest first)
   */
  push(datapoint: Datapoint): void {
    // Add to front
    this.buffer.unshift(datapoint);

    // Remove duplicates by ID (keep only newest)
    const seen = new Set<string>();
    this.buffer = this.buffer.filter(dp => {
      if (seen.has(dp.id)) {
        return false;
      }
      seen.add(dp.id);
      return true;
    });

    // Trim to max size
    if (this.buffer.length > this.maxSize) {
      this.buffer.pop();
    }

    this.bufferUpdated$.next([...this.buffer]);
    this.messageCount$.next(this.messageCount$.value + 1);
  }

  /**
   * Initialize the buffer with initial values
   */
  initialize(datapoints: Datapoint[]): void {
    this.buffer = [...datapoints];
    this.bufferUpdated$.next([...this.buffer]);
  }

  /**
   * Get filtered buffer based on criteria
   */
  getFiltered(criteria: LiveFilterCriteria): Datapoint[] {
    return this.buffer.filter(dp => this.matches(dp, criteria));
  }

  /**
   * Get the current buffer
   */
  getBuffer(): Datapoint[] {
    return [...this.buffer];
  }

  /**
   * Get buffer as observable
   */
  getBuffer$(): Observable<Datapoint[]> {
    return this.bufferUpdated$.asObservable();
  }

  /**
   * Get message count as observable (for connection status display)
   */
  getMessageCount$(): Observable<number> {
    return this.messageCount$.asObservable();
  }

  /**
   * Set connection status
   */
  setConnected(connected: boolean): void {
    this.isConnected$.next(connected);
  }

  /**
   * Get connection status
   */
  isConnectedValue(): boolean {
    return this.isConnected$.value;
  }

  getIsConnected$(): Observable<boolean> {
    return this.isConnected$.asObservable();
  }

  /**
   * Clear buffer
   */
  clear(): void {
    this.buffer = [];
    this.messageCount$.next(0);
    this.bufferUpdated$.next([]);
  }

  /**
   * Get the current buffer size
   */
  getSize(): number {
    return this.buffer.length;
  }

  /**
   * Check if datapoint matches filter criteria
   */
  private matches(datapoint: Datapoint, criteria: LiveFilterCriteria): boolean {
    // Search term
    if (criteria.searchTerm) {
      const term = criteria.searchTerm.toLowerCase();
      const matches =
        datapoint.title.toLowerCase().includes(term) ||
        datapoint.deviceTitle?.toLowerCase().includes(term) ||
        datapoint.locationTitle?.toLowerCase().includes(term) ||
        datapoint.value?.toString().toLowerCase().includes(term) ||
        datapoint.id.toLowerCase().includes(term);
      if (!matches) return false;
    }

    // Device filter
    if (criteria.devices && criteria.devices.length > 0) {
      if (!datapoint.deviceId || !criteria.devices.includes(datapoint.deviceId)) {
        return false;
      }
    }

    // Location filter
    if (criteria.locations && criteria.locations.length > 0) {
      if (!datapoint.locationId || !criteria.locations.includes(datapoint.locationId)) {
        return false;
      }
    }

    // DPT type filter
    if (criteria.dptTypes && criteria.dptTypes.length > 0) {
      if (!datapoint.dptType || !criteria.dptTypes.includes(datapoint.dptType)) {
        return false;
      }
    }

    // Value range (for numeric values)
    if (criteria.valueMin !== undefined || criteria.valueMax !== undefined) {
      const val = parseFloat(datapoint.value || '0');
      if (isNaN(val)) return false;
      if (criteria.valueMin !== undefined && val < criteria.valueMin) return false;
      if (criteria.valueMax !== undefined && val > criteria.valueMax) return false;
    }

    // Quality filter
    if (criteria.qualityValid !== undefined) {
      if (datapoint.qualityValid !== criteria.qualityValid) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Filter criteria for live buffer queries
 */
export interface LiveFilterCriteria {
  searchTerm?: string;
  devices?: string[]; // Device IDs
  locations?: string[]; // Location IDs
  dptTypes?: string[]; // DPT types like "9.1", "5.1"
  valueMin?: number;
  valueMax?: number;
  qualityValid?: boolean;
}
