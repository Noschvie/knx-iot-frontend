import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DeviceService } from '@core/services/device.service';
import { Device } from '@shared/models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DevicesComponent implements OnInit, OnDestroy {
  devices: Device[] = [];
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private deviceService: DeviceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDevices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDevices(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.deviceService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (devices) => {
          console.log(`[Devices Component] Data received: ${devices?.length || 0} devices`);
          this.devices = devices || [];
          this.loading = false;
          this.cdr.markForCheck();
          console.log(`[Devices Component] ✓ ${devices.length} devices loaded`);
        },
        error: (err) => {
          console.error('[Devices Component] ✗ Error loading devices:', err);
          this.error = 'Error loading devices';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  getStatusBadgeClass(status: string | undefined): string {
    if (!status) return 'status-unknown';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('online') || statusLower.includes('active')) return 'status-online';
    if (statusLower.includes('offline') || statusLower.includes('inactive')) return 'status-offline';
    return 'status-unknown';
  }

  getStatusLabel(status: string | undefined): string {
    if (!status) return 'Unknown';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('online') || statusLower.includes('active')) return 'Online';
    if (statusLower.includes('offline') || statusLower.includes('inactive')) return 'Offline';
    return status;
  }

  formatLastSeen(lastSeen: Date | undefined): string {
    if (!lastSeen) return 'Never';
    const now = new Date();
    const diff = now.getTime() - new Date(lastSeen).getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
}
