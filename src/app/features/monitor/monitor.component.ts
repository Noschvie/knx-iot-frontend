import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatBadgeModule } from '@angular/material/badge';

import { Subject, Observable, combineLatest, of } from 'rxjs';
import { takeUntil, debounceTime, startWith } from 'rxjs/operators';

import { Datapoint } from '@shared/models';
import { DatapointService } from '@core/services/datapoint.service';
import { DeviceService } from '@core/services/device.service';
import { LocationService } from '@core/services/location.service';
import { WebSocketService } from '@core/websocket/websocket.service';
import { LiveBufferService, LiveFilterCriteria } from '@core/services/live-buffer.service';
import { Device, Location } from '@shared/models';

@Component({
  selector: 'app-monitor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ScrollingModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatBadgeModule
  ],
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.scss']
})
export class MonitorComponent implements OnInit, OnDestroy {
  // Display data
  datapoints: Datapoint[] = [];
  devices: Device[] = [];
  locations: Location[] = [];

  // UI state
  isLoading = true;
  isPaused = false;
  isAutoScroll = true;
  isConnected = false;
  messageCount = 0;

  // Filter form
  filterForm: FormGroup;
  dptTypes$: Observable<string[]>;
  private dptTypesSet: Set<string> = new Set();

  // Cleanup
  private destroy$ = new Subject<void>();


  // Column configuration
  displayedColumns: string[] = [
    'timestamp',
    'datapointName',
    'deviceName',
    'location',
    'value',
    'valueRaw',
    'dptType'
  ];

  constructor(
    private datapointService: DatapointService,
    private deviceService: DeviceService,
    private locationService: LocationService,
    private webSocketService: WebSocketService,
    private liveBuffer: LiveBufferService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      devices: [[]],
      locations: [[]],
      dptTypes: [[]],
      qualityValid: [undefined]
    });

    // Initialize dptTypes$ with empty array
    this.dptTypes$ = of([]);
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFilterListener();
    this.connectWebSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.webSocketService.disconnect();
    this.liveBuffer.clear();
  }

  /**
   * Load initial data: devices, locations, and latest datapoints
   */
  private loadInitialData(): void {
    this.isLoading = true;

    combineLatest([
      this.deviceService.getAll(),
      this.locationService.getAll(),
      this.datapointService.getLatestValues(100)
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([devices, locations, datapoints]) => {
          this.devices = devices;
          this.locations = locations;
          this.datapoints = datapoints;

          // Collect unique DPT types for filter dropdown
          datapoints.forEach(dp => {
            if (dp.dptType) {
              this.dptTypesSet.add(dp.dptType);
            }
          });

          // Convert Set to array for Observable
          const typeArray = Array.from(this.dptTypesSet).sort();
          this.dptTypes$ = of(typeArray);

          // Initialize buffer
          this.liveBuffer.initialize(datapoints);
          this.updateDisplayedDatapoints();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading initial data:', err);
          this.isLoading = false;
        }
      });
  }

  /**
   * Connect to WebSocket and listen for datapoint updates
   */
  private connectWebSocket(): void {
    this.webSocketService
      .connect()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => {
          if (message.type === 'connected') {
            this.isConnected = true;
            this.liveBuffer.setConnected(true);
            console.log('[Monitor] ✓ WebSocket connected');
          } else if (message.type === 'connection_error') {
            // WebSocket connection error - log for debugging
            console.warn('[Monitor] WebSocket connection error:', message.error);
            this.isConnected = false;
            this.liveBuffer.setConnected(false);
          } else if (message.type === 'datapoint_updated') {
            this.handleDatapointUpdate(message);
          } else if (message.type === 'batch') {
            // Handle batch updates
            message.updates.forEach((update: any) => {
              this.handleDatapointUpdate(update);
            });
          }
        },
        error: (err) => {
          console.error('[Monitor] WebSocket subscription error:', err);
          this.isConnected = false;
          this.liveBuffer.setConnected(false);
        },
        complete: () => {
          console.log('[Monitor] WebSocket connection closed');
          this.isConnected = false;
          this.liveBuffer.setConnected(false);
        }
      });
  }

  /**
   * Handle incoming datapoint update from WebSocket
   */
  private handleDatapointUpdate(message: any): void {
    // Create or update datapoint from message
    const updatedDatapoint: Datapoint = {
      id: message.id,
      title: message.title || 'Unknown',
      value: message.value,
      valueRaw: message.valueRaw,
      lastUpdated: new Date(message.timestamp),
      deviceId: message.deviceId,
      deviceTitle: this.findDeviceTitle(message.deviceId),
      locationId: this.findLocationIdByDeviceId(message.deviceId),
      locationTitle: this.findLocationTitle(this.findLocationIdByDeviceId(message.deviceId)),
      dptType: message.dptType,
      readable: true,
      writable: false,
      qualityValid: message.qualityValid !== false
    };

    if (!this.isPaused) {
      this.liveBuffer.push(updatedDatapoint);
      this.messageCount++;
      this.updateDisplayedDatapoints();
    }
  }

  /**
   * Setup filter listener for real-time filtering
   */
  private setupFilterListener(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        startWith(this.filterForm.value),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateDisplayedDatapoints();
      });

    // Also listen to buffer updates
    this.liveBuffer
      .getBuffer$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.isPaused) {
          this.updateDisplayedDatapoints();
        }
      });
  }

  /**
   * Update displayed datapoints based on filters
   */
  private updateDisplayedDatapoints(): void {
    const filterCriteria: LiveFilterCriteria = {
      searchTerm: this.filterForm.get('searchTerm')?.value,
      devices: this.filterForm.get('devices')?.value || [],
      locations: this.filterForm.get('locations')?.value || [],
      dptTypes: this.filterForm.get('dptTypes')?.value || [],
      qualityValid: this.filterForm.get('qualityValid')?.value
    };

    this.datapoints = this.liveBuffer.getFiltered(filterCriteria);
  }

  /**
   * Toggle pause/resume
   */
  togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  /**
   * Toggle auto-scroll
   */
  toggleAutoScroll(): void {
    this.isAutoScroll = !this.isAutoScroll;
  }

  /**
   * Clear buffer and reset
   */
  clearBuffer(): void {
    this.liveBuffer.clear();
    this.messageCount = 0;
    this.datapoints = [];
  }

  /**
   * Export current data as CSV
   */
  exportCSV(): void {
    const headers = this.displayedColumns.map(col => this.getColumnHeader(col));
    const rows = this.datapoints.map(dp => this.getRowData(dp));

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monitor-${new Date().toISOString().substring(0, 19)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get column header text
   */
  private getColumnHeader(col: string): string {
    const headers: { [key: string]: string } = {
      timestamp: 'Timestamp',
      datapointName: 'Datapoint',
      deviceName: 'Device',
      location: 'Location',
      value: 'Value',
      valueRaw: 'Raw Value',
      dptType: 'Type'
    };
    return headers[col] || col;
  }

  /**
   * Get row data for CSV export
   */
  private getRowData(dp: Datapoint): string[] {
    return [
      dp.lastUpdated?.toISOString() || '',
      dp.title,
      dp.deviceTitle || '',
      dp.locationTitle || '',
      dp.value || '',
      dp.valueRaw || '',
      dp.dptType || ''
    ];
  }

  /**
   * Helper: Find device title by ID
   */
  private findDeviceTitle(deviceId?: string): string | undefined {
    return this.devices.find(d => d.id === deviceId)?.title;
  }

  /**
   * Helper: Find location ID by device ID
   */
  private findLocationIdByDeviceId(deviceId?: string): string | undefined {
    return this.devices.find(d => d.id === deviceId)?.locationId;
  }

  /**
   * Helper: Find location title by ID
   */
  private findLocationTitle(locationId?: string): string | undefined {
    return this.locations.find(l => l.id === locationId)?.title;
  }
}
