import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '@core/config/config.service';

/**
 * Logger Service for frontend logging
 *
 * This service hijacks console.log and console.error to ensure that all log messages
 * are visible in the browser console with timestamps in local timezone.
 *
 * Logs are sent directly to Syslog server via UDP-bridge service.
 * Especially useful for auth debugging.
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private originalLog: any;
  private originalError: any;
  private originalWarn: any;
  private logs: Array<{ timestamp: string; level: string; message: string; priority: number; severity: number }> = [];
  private http: HttpClient | null = null;
  private configService: ConfigService | null = null;

  constructor(private injector: Injector) {
    this.setupLogging();
  }

  /**
   * Initialize HTTP and Config services after DI is ready
   */
  private ensureServices(): void {
    if (!this.http) {
      try {
        this.http = this.injector.get(HttpClient);
        this.configService = this.injector.get(ConfigService);
      } catch (e) {
        // Services not yet available
      }
    }
  }

  private setupLogging(): void {
    // Store original console methods
    this.originalLog = console.log;
    this.originalError = console.error;
    this.originalWarn = console.warn;

    // Override console methods with timestamp
    console.log = this.createLogFunction('LOG', this.originalLog);
    console.error = this.createLogFunction('ERROR', this.originalError);
    console.warn = this.createLogFunction('WARN', this.originalWarn);

    // Log service initialization
    this.originalLog('[Logger Service] Initialized at', this.formatLocalTimestamp());
  }

  /**
   * Format timestamp in the local timezone with format: HH:mm:ss.SSS
   */
  private formatLocalTimestamp(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  private createLogFunction(level: string, originalFn: any) {
    return (...args: any[]) => {
      const timestamp = this.formatLocalTimestamp();
      const formattedMessage = `[${timestamp}] [${level}]`;

      // Call original function with enhanced message
      originalFn(formattedMessage, ...args);

      // Store log with syslog metadata
      const message = this.formatLogMessage(args);
      const severity = this.mapLevelToSeverity(level);
      const priority = (16 * 8) + severity; // Facility 16 (local0)
      this.storeLog(timestamp, level, message, priority, severity);

      // Send it to Syslog via UDP-bridge service
      this.sendToSyslogServer(timestamp, level, message, priority, severity);
    };
  }

  /**
   * Format log message arguments into a string
   */
  private formatLogMessage(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'string') {
        return arg;
      }
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }

  /**
   * Map log level to syslog severity (0-7)
   */
  private mapLevelToSeverity(level: string): number {
    const severityMap: { [key: string]: number } = {
      'LOG': 6,      // Informational
      'WARN': 4,     // Warning
      'ERROR': 3     // Error
    };
    return severityMap[level] || 6;
  }

  /**
   * Store log message in memory with syslog metadata (limited to 500 entries)
   */
  private storeLog(timestamp: string, level: string, message: string, priority: number, severity: number): void {
    this.logs.push({ timestamp, level, message, priority, severity });
    // Keep only last 500 logs in memory
    if (this.logs.length > 500) {
      this.logs.shift();
    }
  }

  /**
   * Send log to Syslog server via UDP-bridge service
   * The bridge service (running on localhost:9514) forwards logs to Syslog server via UDP
   */
  private sendToSyslogServer(timestamp: string, level: string, message: string, priority: number, severity: number): void {
    this.ensureServices();

    if (!this.http) {
      this.originalLog('[Logger Service] HTTP client not ready, cannot send logs');
      return;
    }

    try {
      const hostname = window.location.hostname || 'knx-frontend';
      const tag = 'knx-iot-frontend';

      // Send to bridge service via Nginx proxy on /syslog endpoint
      // Nginx proxies /syslog to localhost:9514 (bridge service)
      const bridgeUrl = `/syslog`;

      const logData = {
        priority,
        severity,
        timestamp,
        level,
        hostname,
        tag,
        message,
        userAgent: navigator.userAgent
      };

      // Send it without waiting for response to not block UI
      this.http.post(bridgeUrl, logData, {
        responseType: 'text',
        headers: { 'Content-Type': 'application/json' }
      }).subscribe(
        (response) => {
          // Success - log sent to bridge
        },
        (error) => {
          // Log error to original console to avoid infinite loop
          this.originalLog(`[Logger Service] Failed to send to bridge:`, error.status, error.statusText);
        }
      );
    } catch (e) {
      this.originalLog('[Logger Service] Exception sending log:', e);
    }
  }

  /**
   * Get all stored logs (for debug panel)
   */
  getLogs(): Array<{ timestamp: string; level: string; message: string; priority: number; severity: number }> {
    return [...this.logs];
  }

  /**
   * Clear stored logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Log an info message
   */
  info(...args: any[]): void {
    console.log(...args);
  }

  /**
   * Log an error message
   */
  error(...args: any[]): void {
    console.error(...args);
  }

  /**
   * Log a warning message
   */
  warn(...args: any[]): void {
    console.warn(...args);
  }

  /**
   * Log auth-specific debugging information
   */
  authDebug(message: string, data?: any): void {
    if (data) {
      console.log(`[AUTH DEBUG] ${message}`, data);
    } else {
      console.log(`[AUTH DEBUG] ${message}`);
    }
  }
}
