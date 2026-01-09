/**
 * Production-safe logger utility
 * Logs are only output in development mode unless explicitly enabled
 */

const isDev = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG === 'true';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  prefix?: string;
  enabled?: boolean;
}

class Logger {
  private prefix: string;
  private enabled: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix ? `[${options.prefix}]` : '';
    this.enabled = options.enabled ?? (isDev || isDebugEnabled);
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.enabled && level !== 'error') return;

    const timestamp = new Date().toISOString();
    const formattedPrefix = this.prefix ? `${this.prefix} ` : '';

    switch (level) {
      case 'debug':
        if (isDev) console.debug(`${formattedPrefix}${message}`, ...args);
        break;
      case 'info':
        console.info(`${formattedPrefix}${message}`, ...args);
        break;
      case 'warn':
        console.warn(`${formattedPrefix}${message}`, ...args);
        break;
      case 'error':
        // Errors always log, even in production
        console.error(`${formattedPrefix}${message}`, ...args);
        break;
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.formatMessage('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.formatMessage('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.formatMessage('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.formatMessage('error', message, ...args);
  }

  // Create a child logger with a specific prefix
  child(prefix: string): Logger {
    const childPrefix = this.prefix ? `${this.prefix.slice(1, -1)}:${prefix}` : prefix;
    return new Logger({ prefix: childPrefix, enabled: this.enabled });
  }
}

// Pre-configured loggers for different modules
export const logger = new Logger();
export const syncLogger = new Logger({ prefix: 'Sync' });
export const queueLogger = new Logger({ prefix: 'Queue' });
export const networkLogger = new Logger({ prefix: 'Network' });
export const swLogger = new Logger({ prefix: 'SW' });
export const apiLogger = new Logger({ prefix: 'API' });

// Factory function to create custom loggers
export function createLogger(prefix: string, enabled?: boolean): Logger {
  return new Logger({ prefix, enabled });
}

export default logger;
