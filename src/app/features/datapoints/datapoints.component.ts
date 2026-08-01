import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DatapointService } from '@core/services/datapoint.service';
import { Datapoint } from '@shared/models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-datapoints',
  templateUrl: './datapoints.component.html',
  styleUrls: ['./datapoints.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatapointsComponent implements OnInit, OnDestroy {
  datapoints: Datapoint[] = [];
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private datapointService: DatapointService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDatapoints();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDatapoints(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.datapointService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (datapoints) => {
          console.log(`[Datapoints Component] Data received: ${datapoints?.length || 0} datapoints`);
          this.datapoints = datapoints || [];
          this.loading = false;
          this.cdr.markForCheck();
          console.log(`[Datapoints Component] ✓ ${datapoints.length} datapoints loaded`);
        },
        error: (err) => {
          console.error('[Datapoints Component] ✗ Error loading datapoints:', err);
          this.error = 'Error loading datapoints';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  formatValue(datapoint: Datapoint): string {
    if (!datapoint.value) return '-';
    const value = datapoint.value;
    const unit = datapoint.unit ? ` ${datapoint.unit}` : '';
    return `${value}${unit}`;
  }

  getQualityBadgeClass(qualityValid: boolean | undefined): string {
    return qualityValid ? 'quality-valid' : 'quality-invalid';
  }

  getQualityLabel(qualityValid: boolean | undefined): string {
    return qualityValid ? 'Valid' : 'Invalid';
  }
}
