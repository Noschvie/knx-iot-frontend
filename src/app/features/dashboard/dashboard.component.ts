import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { combineLatest } from 'rxjs';
import { map, tap, mergeMap } from 'rxjs/operators';
import { DatapointService } from '@core/services/datapoint.service';
import { DeviceService } from '@core/services/device.service';
import { LocationService } from '@core/services/location.service';
import { Datapoint, Device, Location } from '@shared/models';

interface MetricCard {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: string;
}

interface ActivityItem {
  id: string;
  title: string;
  value: string;
  timestamp: Date;
  device?: string;
  unit?: string;
}

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // Computed data
  metrics: MetricCard[] = [];
  recentActivity: ActivityItem[] = [];
  topDatapoints: Datapoint[] = [];

  isLoading = true;
  errorMessage: string | null = null;
  now = new Date();  // For template use

  constructor(
    private datapointService: DatapointService,
    private deviceService: DeviceService,
    private locationService: LocationService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Show empty UI immediately
    this.isLoading = false;
    this.metrics = [
      { title: 'Datapoints', value: '...', subtitle: 'Loading' },
      { title: 'Devices', value: '...', subtitle: 'Loading' },
      { title: 'Locations', value: '...', subtitle: 'Loading' },
      { title: 'Writable', value: '...', subtitle: 'Loading' }
    ];
    console.log('[Dashboard] ✅ Initial UI rendered with empty state');

    // Load data in background
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    console.log('[Dashboard] ⏳ Starting background data load...');

    // Load all data in parallel
    console.log('[Dashboard] 📡 Requesting: Devices, Locations, then Datapoints');

    combineLatest([
      this.deviceService.getAll().pipe(
        tap(data => console.log(`[Dashboard] ✓ Devices loaded: ${data.length} items`))
      ),
      this.locationService.getAll().pipe(
        tap(data => console.log(`[Dashboard] ✓ Locations loaded: ${data.length} items`))
      )
    ])
      .pipe(
        tap(() => {
          console.log('[Dashboard] ✓ Devices and Locations ready, now fetching datapoints...');
        }),
        // Then fetch datapoints with device/location enrichment
        mergeMap(([devices, locations]) => {
          console.log('[Dashboard] 📍 About to fetch datapoints with enrichment data...');
          return this.datapointService.getLatestValues(100,
            devices.map(d => ({ id: d.id, title: d.title })),
            locations.map(l => ({ id: l.id, title: l.title }))
          ).pipe(
            tap(datapoints => console.log(`[Dashboard] ✓ Datapoints loaded: ${datapoints.length} items`)),
            map(datapoints => ({ datapoints, devices, locations }))
          );
        }),
        tap(({ datapoints, devices, locations }) => {
          console.log('[Dashboard] ✓ All data received, processing...');
          this.handleDataLoaded(datapoints, devices, locations);
        })
      )
      .subscribe(
        () => {
          console.log('[Dashboard] ✅ Background data loaded successfully - UI updated');
        },
        (error) => {
          console.error('[Dashboard] ❌ ERROR loading dashboard data!', {
            status: error?.status || 'unknown',
            statusText: error?.statusText || 'unknown',
            message: error?.message || error?.toString(),
            url: error?.url || 'unknown'
          });
          this.ngZone.run(() => {
            this.errorMessage = `Error loading dashboard: ${error?.status || 'Unknown'} ${error?.statusText || error?.message || 'Connection failed'}`;
            this.cdr.markForCheck();
          });
        }
      );
  }

  private handleDataLoaded(
    datapoints: Datapoint[],
    devices: Device[],
    locations: Location[]
  ): void {
    // Create location lookup map - Datapoints have locationId, use that for display
    const locationMap = new Map(locations.map(l => [l.id, l]));

    // Enrich datapoints with location information
    const enrichedDatapoints = datapoints.map(dp => {
      const location = locationMap.get(dp.locationId || '');
      return {
        ...dp,
        deviceTitle: location?.title || 'Unknown Location'
      };
    });


    // Compute metrics
    this.metrics = [
      {
        title: 'Datapoints',
        value: enrichedDatapoints.length,
        subtitle: 'Total configured'
      },
      {
        title: 'Devices',
        value: devices.length,
        subtitle: 'Online: ' + devices.filter(d => d.status === 'online').length
      },
      {
        title: 'Locations',
        value: locations.length,
        subtitle: 'Hierarchy levels'
      },
      {
        title: 'Writable',
        value: enrichedDatapoints.filter(d => d.writable).length,
        subtitle: 'Read/Write Datapoints'
      }
    ];


    // Get top 10 most recently updated datapoints
    this.topDatapoints = enrichedDatapoints
      .sort((a, b) => {
        const timeA = a.lastUpdated?.getTime() || 0;
        const timeB = b.lastUpdated?.getTime() || 0;
        return timeB - timeA;
      })
      .slice(0, 10);


    // Build activity feed
    this.recentActivity = this.topDatapoints.map(dp => ({
      id: dp.id,
      title: dp.title,
      value: dp.value || 'N/A',
      timestamp: dp.lastUpdated || new Date(),
      unit: dp.unit,
      device: dp.deviceTitle || 'Unknown'
    }));

    // Mark for check to ensure Angular detects changes
    this.cdr.markForCheck();
  }

  /**
   * Format timestamp as relative time (e.g., "Just now", "5 minutes ago")
   */
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hrs ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  /**
   * Format value with unit
   */
  formatValue(value: string | undefined, unit?: string): string {
    if (!value) return 'N/A';
    return unit ? `${value} ${unit}` : value;
  }

  /**
   * Refresh dashboard data
   */
  refresh(): void {
    this.loadDashboardData();
  }

  /**
   * Get status badge color for the device
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'warn';
      default: return 'info';
    }
  }
}
