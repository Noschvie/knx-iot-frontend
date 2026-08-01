import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { LocationService } from '@core/services/location.service';
import { Location } from '@shared/models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-locations',
  templateUrl: './locations.component.html',
  styleUrls: ['./locations.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocationsComponent implements OnInit, OnDestroy {
  locations: Location[] = [];
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private locationService: LocationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLocations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLocations(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.locationService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (locations) => {
          console.log(`[Locations Component] Data received: ${locations?.length || 0} locations`);
          this.locations = locations || [];
          this.loading = false;
          this.cdr.markForCheck();
          console.log(`[Locations Component] ✓ ${locations.length} locations loaded, rendered=${this.locations.length}`);
        },
        error: (err) => {
          console.error('[Locations Component] ✗ Error loading locations:', err);
          this.error = 'Fehler beim Laden der Standorte';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  getLocationTypeLabel(type: string | undefined): string {
    const types: { [key: string]: string } = {
      'BUILDING': 'Gebäude',
      'FLOOR': 'Etage',
      'ROOM': 'Raum',
      'ZONE': 'Zone'
    };
    return types[type || ''] || type || 'Unbekannt';
  }
}
