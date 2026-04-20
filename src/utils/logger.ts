/**
 * Production-Ready Logger Utility
 * 
 * Replaces console.log statements with production-safe logging
 * Only logs in development mode, silent in production
 */

// type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'; // Unused - commented out

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';
  
  log(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.log(`[LOG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: any) {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error);
    }
    
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error, { extra: { message } });
  }

  debug(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  // Performance monitoring
  time(label: string) {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }
}

export const logger = new Logger();
