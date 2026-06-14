import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import environment from '../config/environment.config';

// Log format
const logFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  format.errors({ stack: true }),
  format.splat(),
  format.ms(),
  format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// Create logger instance
const logger = createLogger({
  level: environment.LOG_LEVEL,
  format: logFormat,
  transports: [],
});

// Console transport for development
if (environment.LOG_OUTPUT === 'console' || environment.NODE_ENV === 'development') {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
      ),
    })
  );
}

// File transport for production
if (environment.NODE_ENV === 'production' && environment.LOG_OUTPUT === 'file') {
  const rotateFileTransport = new DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: 'info',
  });

  logger.add(rotateFileTransport);
}

// Error transport
const errorTransport = new transports.Console({
  level: 'error',
  format: format.combine(
    format.colorize(),
    format.printf(({ level, message, stack }) => {
      return `${level}: ${message}\n${stack}`;
    })
  ),
});

logger.add(errorTransport);

// Log methods
export const log = {
  // Debug level
  debug: (message: string, metadata?: Record<string, unknown>): void => {
    if (environment.LOG_LEVEL === 'debug' || environment.NODE_ENV === 'development') {
      logger.debug(message, metadata);
    }
  },

  // Info level
  info: (message: string, metadata?: Record<string, unknown>): void => {
    logger.info(message, metadata);
  },

  // Warn level
  warn: (message: string, metadata?: Record<string, unknown>): void => {
    logger.warn(message, metadata);
  },

  // Error level
  error: (message: string, error?: Error | unknown): void => {
    if (error instanceof Error) {
      logger.error(message, { stack: error.stack, name: error.name, message: error.message });
    } else {
      logger.error(message, error);
    }
  },

  // HTTP request logging
  request: (method: string, url: string, statusCode: number, duration: number, ip?: string): void => {
    logger.info(`${method} ${url} ${statusCode} ${duration}ms${ip ? ` - ${ip}` : ''}`);
  },

  // Security event logging
  security: (event: string, metadata?: Record<string, unknown>): void => {
    logger.warn('SECURITY EVENT', { event, ...metadata });
  },

  // Database operations
  database: (operation: string, duration: number, metadata?: Record<string, unknown>): void => {
    logger.debug(`DATABASE ${operation} ${duration}ms`, metadata);
  },

  // Performance metrics
  performance: (operation: string, duration: number, metadata?: Record<string, unknown>): void => {
    if (environment.NODE_ENV === 'development') {
      logger.info(`PERFORMANCE ${operation} ${duration}ms`, metadata);
    }
  },
};

// Get logger instance for export
export default logger;

// Types
export interface LogMetadata {
  [key: string]: unknown;
  userId?: string;
  requestId?: string;
  sessionId?: string;
}
