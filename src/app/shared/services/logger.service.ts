import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '@core/config/config.service';

/**
 * Logger Service for frontend logging
 *
 * This service hijacks console.log and console.error to ensure that all log messages
 * are visible both in the browser console and in the container output (docker logs).
 *
 * Logs are sent to a Syslog server for centralized logging.
 * Especially useful for auth debugging.
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private originalLog: any;
  private originalError: any;
  private originalWarn: any;
  private http: HttpClient | null = null;
  private configService: ConfigService | null = null;
  private logs: Array<{ timestamp: string; level: string; message: string }> = [];
  private syslogHost: string = 'localhost';
  private syslogPort: number = 514;

  constructor(private injector: Injector) {
    this.setupLogging();
    this.initializeSyslogConfig();
  }

  /**
   * Initialize syslog configuration from environment
   */
  private initializeSyslogConfig(): void {
    // Try to get syslog config from window object (set by index.html or config service)
    try {
      const config = (window as any).__APP_CONFIG__;
      if (config) {
        this.syslogHost = config.syslogHost || 'localhost';
        this.syslogPort = config.syslogPort || 514;
      }
    } catch (e) {
      // Use defaults
    }
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

      // Store and send log
      const message = this.formatLogMessage(args);
      this.storeLog(timestamp, level, message);
      this.sendLogToSyslog(timestamp, level, message);
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
   * Store log message in memory (limited to 500 entries)
   */
  private storeLog(timestamp: string, level: string, message: string): void {
    this.logs.push({ timestamp, level, message });
    // Keep only last 500 logs in memory
    if (this.logs.length > 500) {
      this.logs.shift();
    }
  }

  /**
   * Send log to syslog server (UDP port 514)
   * Using standard syslog format (RFC 5424)
   */
  private sendLogToSyslog(timestamp: string, level: string, message: string): void {
    this.ensureServices();

    if (!this.http) {
      return;
    }

    try {
      // Map log level to syslog severity (0-7)
      const severityMap: { [key: string]: number } = {
        'LOG': 6,      // Informational
        'WARN': 4,     // Warning
        'ERROR': 3     // Error
      };
      const severity = severityMap[level] || 6;

      // Syslog facility 16 (local0) and severity
      const priority = (16 * 8) + severity;

      // Format: PRI VERSION TIMESTAMP HOSTNAME TAG[PID]: MSG
      const hostname = window.location.hostname || 'knx-frontend';
      const tag = 'knx-iot-frontend';

      // Send it to syslog server via HTTP bridge on backend
      // Note: Browsers can't directly send UDP, so we use HTTP endpoint on backend
      const apiBase = this.configService?.getApiBase() || '';
      const url = `${apiBase}/api/v2/syslog`;

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
      this.http.post(url, logData, {
        responseType: 'text',
        headers: { 'Content-Type': 'application/json' }
      }).subscribe(
        () => {}, // Success - do nothing
        (error) => {
          // Fail silently - backend endpoint may not exist
        }
      );
    } catch (e) {
      // Silently ignore errors
    }
  }

  /**
   * Get all stored logs (for debug panel)
   */
  getLogs(): Array<{ timestamp: string; level: string; message: string }> {
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
