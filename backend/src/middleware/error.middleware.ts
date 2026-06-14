import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.util';
import { ERROR_CODES } from '../config/constants';
import { ApiError } from '../types/common.types';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    // Set prototype explicitly (TypeScript requirement)
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Validation error class
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 422, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

// Not found error class
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with ID ${id}` : ''} not found`, 404, ERROR_CODES.NOT_FOUND);
  }
}

// Unauthorized error class
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, ERROR_CODES.UNAUTHORIZED);
  }
}

// Forbidden error class
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, ERROR_CODES.FORBIDDEN);
  }
}

// Conflict error class
export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409, ERROR_CODES.CONFLICT);
  }
}

// Rate limit error class
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  }
}

// External API error class
export class ExternalApiError extends AppError {
  public serviceName: string;

  constructor(serviceName: string, message: string) {
    super(message, 503, ERROR_CODES.EXTERNAL_API_ERROR);
    this.serviceName = serviceName;
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error with context
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: (req as any).requestId,
  });

  // Check if it's an operational error
  if (err instanceof AppError) {
    sendErrorResponse(res, err);
    return;
  }

  // Check for Mongoose errors
  if (err.name === 'ValidationError') {
    const mongooseError = err as any;
    sendErrorResponse(res, new ValidationError('Validation failed', mongooseError.errors));
    return;
  }

  if (err.name === 'CastError') {
    sendErrorResponse(res, new NotFoundError('Resource', 'invalid ID'));
    return;
  }

  if (err.name === 'DuplicateKeyError') {
    const mongooseError = err as any;
    const key = Object.keys(mongooseError.keyValue || {})[0];
    sendErrorResponse(res, new ConflictError(`Duplicate ${key} value`));
    return;
  }

  // Default error response
  sendErrorResponse(res, new AppError(err.message, 500));
};

// Send error response
const sendErrorResponse = (res: Response, error: AppError): void => {
  // Don't leak stack in production
  const errorResponse: ApiError = {
    code: error.code,
    message: error.message,
    ...(error.details ? { details: error.details } : {}),
    ...(process.env.NODE_ENV !== 'production' && error.stack ? { stack: error.stack } : {}),
  };

  res.status(error.statusCode).json({
    success: false,
    error: errorResponse,
  });
};

// 404 handler middleware
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  logger.warn('Route not found:', {
    path: req.path,
    method: req.method,
    requestId: (req as any).requestId,
  });

  res.status(404).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Endpoint ${req.method} ${req.path} not found`,
    },
  });
};

// Export all error classes and middleware
export default {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  ExternalApiError,
  errorHandler,
  notFoundHandler,
};
