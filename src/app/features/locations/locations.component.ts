import { Component, OnInit, OnDestroy } from '@angular/core';
import { LocationService } from '@core/services/location.service';
import { Location } from '@shared/models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-locations',
  templateUrl: './locations.component.html',
  styleUrls: ['./locations.component.scss']
})
export class LocationsComponent implements OnInit, OnDestroy {
  locations: Location[] = [];
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private locationService: LocationService) {}

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

    this.locationService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (locations) => {
          this.locations = locations;
          this.loading = false;
          console.log(`[Locations Component] ✓ ${locations.length} locations loaded`);
        },
        error: (err) => {
          console.error('[Locations Component] ✗ Error loading locations:', err);
          this.error = 'Fehler beim Laden der Standorte';
          this.loading = false;
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

