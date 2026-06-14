import { Response } from 'express';
import { ApiResponse, ApiError } from '../types/common.types';

// Standardized response formatter
export class ResponseFormatter {
  // Success response
  static success<T>(res: Response, data: T, message?: string, pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      pagination: pagination ? {
        ...pagination,
        hasNextPage: pagination.page < pagination.totalPages,
        hasPrevPage: pagination.page > 1,
      } : undefined,
    };

    return res.status(200).json(response);
  }

  // Created response
  static created<T>(res: Response, data: T, message?: string): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };

    return res.status(201).json(response);
  }

  // No content response
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  // Error response
  static error<T>(res: Response, error: ApiError, statusCode: number = 400): Response {
    const response: ApiResponse<T> = {
      success: false,
      error,
    };

    return res.status(statusCode).json(response);
  }

  // Validation error response
  static validationError(res: Response, errors: string[], fieldErrors?: Record<string, string>): Response {
    const error: ApiError = {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: {
        errors,
        fieldErrors,
      },
    };

    return res.status(422).json({
      success: false,
      error,
    });
  }

  // Unauthorized response
  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    const error: ApiError = {
      code: 'UNAUTHORIZED',
      message,
    };

    return res.status(401).json({
      success: false,
      error,
    });
  }

  // Forbidden response
  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    const error: ApiError = {
      code: 'FORBIDDEN',
      message,
    };

    return res.status(403).json({
      success: false,
      error,
    });
  }

  // Not found response
  static notFound(res: Response, resource: string, id?: string): Response {
    const error: ApiError = {
      code: 'NOT_FOUND',
      message: `${resource}${id ? ` with ID ${id}` : ''} not found`,
    };

    return res.status(404).json({
      success: false,
      error,
    });
  }

  // Conflict response
  static conflict(res: Response, message: string = 'Conflict'): Response {
    const error: ApiError = {
      code: 'CONFLICT',
      message,
    };

    return res.status(409).json({
      success: false,
      error,
    });
  }

  // Rate limit exceeded response
  static rateLimit(res: Response, message: string = 'Too many requests'): Response {
    const error: ApiError = {
      code: 'RATE_LIMIT_EXCEEDED',
      message,
    };

    return res.status(429).json({
      success: false,
      error,
    });
  }

  // Internal server error response
  static internalError(res: Response, message: string = 'Internal server error'): Response {
    const error: ApiError = {
      code: 'INTERNAL_ERROR',
      message,
    };

    return res.status(500).json({
      success: false,
      error,
    });
  }

  // Service unavailable response
  static serviceUnavailable(res: Response, message: string = 'Service unavailable'): Response {
    const error: ApiError = {
      code: 'SERVICE_UNAVAILABLE',
      message,
    };

    return res.status(503).json({
      success: false,
      error,
    });
  }

  // Success response with pagination
  static successWithPagination<T>(
    res: Response,
    data: T,
    pagination: { page: number; limit: number; total: number; totalPages: number },
    message?: string
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      pagination: {
        ...pagination,
        hasNextPage: pagination.page < pagination.totalPages,
        hasPrevPage: pagination.page > 1,
      },
    };

    return res.status(200).json(response);
  }

  // Pagination helper
  static createPagination(
    page: number,
    limit: number,
    total: number,
    totalPages?: number
  ): { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean } {
    const calculatedTotalPages = totalPages || Math.ceil(total / limit);
    const hasNextPage = page < calculatedTotalPages;
    const hasPrevPage = page > 1;

    return {
      page,
      limit,
      total,
      totalPages: calculatedTotalPages,
      hasNextPage,
      hasPrevPage,
    };
  }
}

// Export as singleton
export const response = ResponseFormatter;
