/**
 * Centralized logging utility for structured logging across the application
 * Provides consistent log formatting and error tracking for production debugging
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  service?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error): string {
    const timestamp = new Date().toISOString();
    const logEntry: any = {
      timestamp,
      level,
      message,
      ...context,
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // In development, pretty print; in production, use JSON for log aggregation
    if (this.isDevelopment) {
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';
      const errorStr = error ? `\n${error.stack}` : '';
      return `[${timestamp}] [${level}] ${message}${contextStr}${errorStr}`;
    }

    return JSON.stringify(logEntry);
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, context, error));
  }

  error(message: string, context?: LogContext, error?: Error): void {
    console.error(this.formatMessage(LogLevel.ERROR, message, context, error));
  }

  // Helper for logging API errors with full context
  apiError(endpoint: string, error: Error, context?: LogContext): void {
    this.error(`API Error: ${endpoint}`, {
      ...context,
      endpoint,
      errorType: error.constructor.name,
    }, error);
  }

  // Helper for logging tRPC procedure errors
  trpcError(procedure: string, error: Error, context?: LogContext): void {
    this.error(`tRPC Error: ${procedure}`, {
      ...context,
      procedure,
      errorType: error.constructor.name,
    }, error);
  }

  // Helper for logging BGPalerter service errors
  bgpalerterError(operation: string, error: Error, context?: LogContext): void {
    this.error(`BGPalerter Error: ${operation}`, {
      ...context,
      operation,
      service: 'bgpalerter',
      errorType: error.constructor.name,
    }, error);
  }
}

// Export singleton instance
export const logger = new Logger();
