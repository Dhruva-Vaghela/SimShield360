import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { response } from '../utils/response.util';

// Validation middleware
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      const body = req.body;
      if (body !== undefined && body !== null) {
        schema.parse(body);
      }

      // Validate query params
      const query = req.query;
      if (query !== undefined && query !== null) {
        // You can create separate schema for query params if needed
      }

      // Validate params
      const params = req.params;
      if (params !== undefined && params !== null) {
        // You can create separate schema for params if needed
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Zod validation error
        const fieldErrors: Record<string, string> = {};
        const errors: string[] = [];

        error.errors.forEach((err) => {
          const path = err.path.join('.');
          const message = err.message;

          if (path) {
            fieldErrors[path] = message;
          } else {
            errors.push(message);
          }
        });

        response.validationError(res, errors, fieldErrors);
        return;
      }

      next(error);
    }
  };
};

// Request body validation
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        const errors: string[] = [];

        error.errors.forEach((err) => {
          const path = err.path.join('.');
          const message = err.message;

          if (path) {
            fieldErrors[path] = message;
          } else {
            errors.push(message);
          }
        });

        response.validationError(res, errors, fieldErrors);
        return;
      }

      next(error);
    }
  };
};

// Query validation
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        const errors: string[] = [];

        error.errors.forEach((err) => {
          const path = err.path.join('.');
          const message = err.message;

          if (path) {
            fieldErrors[path] = message;
          } else {
            errors.push(message);
          }
        });

        response.validationError(res, errors, fieldErrors);
        return;
      }

      next(error);
    }
  };
};

// Params validation
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        const errors: string[] = [];

        error.errors.forEach((err) => {
          const path = err.path.join('.');
          const message = err.message;

          if (path) {
            fieldErrors[path] = message;
          } else {
            errors.push(message);
          }
        });

        response.validationError(res, errors, fieldErrors);
        return;
      }

      next(error);
    }
  };
};

// Request validation interface
export interface RequestValidation {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

// Combined validation middleware
export const validateRequest = (validation: RequestValidation) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (validation.body) {
        validation.body.parse(req.body);
      }
      if (validation.query) {
        validation.query.parse(req.query);
      }
      if (validation.params) {
        validation.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        const errors: string[] = [];

        error.errors.forEach((err) => {
          const path = err.path.join('.');
          const message = err.message;

          if (path) {
            fieldErrors[path] = message;
          } else {
            errors.push(message);
          }
        });

        response.validationError(res, errors, fieldErrors);
        return;
      }

      next(error);
    }
  };
};

// Export all validation middleware
export default {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateRequest,
};
