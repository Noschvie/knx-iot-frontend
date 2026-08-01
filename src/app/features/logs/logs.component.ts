import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoggerService } from '@shared/services/logger.service';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  priority: number;
  severity: number;
}

@Component({
  standalone: false,
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit, OnDestroy {
  logs: LogEntry[] = [];
  filteredLogs: LogEntry[] = [];
  selectedLevel: string = 'ALL';
  private destroy$ = new Subject<void>();

  readonly logLevels = [
    { value: 'ALL', label: 'Alle' },
    { value: 'LOG', label: 'Info' },
    { value: 'WARN', label: 'Warnung' },
    { value: 'ERROR', label: 'Fehler' }
  ];

  constructor(private loggerService: LoggerService) {}

  ngOnInit(): void {
    this.loadLogs();
    // Refresh logs every 2 seconds
    interval(2000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadLogs());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLogs(): void {
    const allLogs = this.loggerService.getLogs();
    this.logs = allLogs.reverse(); // Show newest first
    this.applyFilter();
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    if (this.selectedLevel === 'ALL') {
      this.filteredLogs = this.logs;
    } else {
      this.filteredLogs = this.logs.filter(log => log.level === this.selectedLevel);
    }
  }

  clearLogs(): void {
    if (confirm('Alle Logs wirklich löschen?')) {
      this.loggerService.clearLogs();
      this.logs = [];
      this.filteredLogs = [];
    }
  }

  exportLogs(): void {
    const csv = this.filteredLogs
      .map(l => `"${l.timestamp}","${l.level}","${l.message}"`)
      .join('\n');
    const header = '"Zeitstempel","Level","Nachricht"\n';
    const blob = new Blob([header + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `logs-${new Date().getTime()}.csv`);
    link.click();
  }

  getLevelClass(level: string): string {
    return `level-${level.toLowerCase()}`;
  }
}

