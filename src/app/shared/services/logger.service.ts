import { Injectable } from '@angular/core';

/**
 * Logger Service for frontend logging
 *
 * This service hijacks console.log and console.error to ensure that all log messages
 * are visible both in the browser console and in the container output (docker logs).
 *
 * Especially useful for auth debugging.
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private originalLog: any;
  private originalError: any;
  private originalWarn: any;

  constructor() {
    this.setupLogging();
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
    this.originalLog('[Logger Service] Initialized at', new Date().toISOString());
  }

  private createLogFunction(level: string, originalFn: any) {
    return (...args: any[]) => {
      const timestamp = new Date().toISOString();
      const formattedMessage = `[${timestamp}] [${level}]`;

      // Call original function with enhanced message
      originalFn(formattedMessage, ...args);
    };
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
