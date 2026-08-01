import { Component, OnInit } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';
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
  // Observables
  datapoints$!: Observable<Datapoint[]>;
  devices$!: Observable<Device[]>;
  locations$!: Observable<Location[]>;

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
    private locationService: LocationService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = null;
    console.log('[Dashboard] Starting data load...');

    // Load all data in parallel
    console.log('[Dashboard] Requesting: Datapoints, Devices, Locations');
    combineLatest([
      this.datapointService.getLatestValues(100).pipe(
        tap(data => console.log(`[Dashboard] Datapoints loaded: ${data.length} items`))
      ),
      this.deviceService.getAll().pipe(
        tap(data => console.log(`[Dashboard] Devices loaded: ${data.length} items`))
      ),
      this.locationService.getAll().pipe(
        tap(data => console.log(`[Dashboard] Locations loaded: ${data.length} items`))
      )
    ])
      .pipe(
        tap(([datapoints, devices, locations]) => {
          console.log('[Dashboard] All data received, processing...');
          this.handleDataLoaded(datapoints, devices, locations);
        })
      )
      .subscribe(
        () => {
          console.log('[Dashboard] ✓ Dashboard data loaded successfully');
          this.isLoading = false;
        },
        (error) => {
          console.error('[Dashboard] ✗ Error loading dashboard data:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url
          });
          this.errorMessage = `Error loading dashboard: ${error.status} ${error.statusText}`;
          this.isLoading = false;
        }
      );
  }

  private handleDataLoaded(
    datapoints: Datapoint[],
    devices: Device[],
    locations: Location[]
  ): void {
    console.log('[Dashboard] handleDataLoaded called with:', {
      datapoints: datapoints.length,
      devices: devices.length,
      locations: locations.length
    });

    // Store observables for template
    this.datapoints$ = new Observable(observer => {
      observer.next(datapoints);
      observer.complete();
    });

    this.devices$ = new Observable(observer => {
      observer.next(devices);
      observer.complete();
    });

    this.locations$ = new Observable(observer => {
      observer.next(locations);
      observer.complete();
    });

    // Compute metrics
    this.metrics = [
      {
        title: 'Datapoints',
        value: datapoints.length,
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
        value: datapoints.filter(d => d.writable).length,
        subtitle: 'Read/Write Datapoints'
      }
    ];

    console.log('[Dashboard] Metrics computed:', this.metrics);

    // Get top 10 most recently updated datapoints
    this.topDatapoints = datapoints
      .filter(d => d.value !== undefined && d.value !== null)
      .sort((a, b) => {
        const timeA = a.lastUpdated?.getTime() || 0;
        const timeB = b.lastUpdated?.getTime() || 0;
        return timeB - timeA;
      })
      .slice(0, 10);

    console.log('[Dashboard] Top datapoints:', this.topDatapoints.length);

    // Build activity feed (recent updates)
    this.recentActivity = this.topDatapoints.map(dp => ({
      id: dp.id,
      title: dp.title,
      value: dp.value || 'N/A',
      timestamp: dp.lastUpdated || new Date(),
      unit: dp.unit,
      device: dp.deviceTitle
    }));

    console.log('[Dashboard] Recent activity:', this.recentActivity.length);
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
