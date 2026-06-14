import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.util';

// Request logging middleware
export const requestLogger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const startTime = Date.now();

  // Log request details
  logger.debug('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
    },
    requestId: (req as any).requestId,
  });

  // Capture response data
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    const duration = Date.now() - startTime;

    // Log response details
    logger.info('Response sent', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: (req as any).requestId,
    });

    return originalJson(body);
  };

  next();
};

// Performance logging middleware
export const performanceLogger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const startTime = Date.now();

  // Track request duration
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Log performance metrics for slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        requestId: (req as any).requestId,
      });
    }
  });

  next();
};

// Security event logging middleware
export const securityLogger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Log suspicious patterns
  const suspiciousPatterns = [
    { pattern: /\.\./g, reason: 'Path traversal attempt' },
    { pattern: /<script/gi, reason: 'XSS attempt' },
    { pattern: /('|")(\s*)(union|select|insert|update|delete|drop)/gi, reason: 'SQL injection attempt' },
  ];

  const path = req.path + JSON.stringify(req.query);
  const body = JSON.stringify(req.body);

  for (const { pattern, reason } of suspiciousPatterns) {
    if (pattern.test(path) || pattern.test(body)) {
      logger.warn('Suspicious request detected', {
        reason,
        method: req.method,
        path: req.path,
        ip: req.ip || req.connection.remoteAddress,
        requestId: (req as any).requestId,
      });

      // Note: Don't block here, let the validation middleware handle it
      break;
    }
  }

  next();
};

// Audit logging middleware (for sensitive operations)
export const auditLogger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Log sensitive operations
  const sensitivePaths = [
    '/auth/login',
    '/auth/logout',
    '/swap-requests',
    '/simlocks',
    '/audit',
    '/admin',
  ];

  if (sensitivePaths.some((path) => req.path.startsWith(path))) {
    logger.info('Sensitive operation', {
      method: req.method,
      path: req.path,
      userId: (req as any).user?.id,
      ip: req.ip || req.connection.remoteAddress,
      requestId: (req as any).requestId,
    });
  }

  next();
};

// Export all logging middleware
export default {
  requestLogger,
  performanceLogger,
  securityLogger,
  auditLogger,
};
