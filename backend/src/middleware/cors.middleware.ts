import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import config from '../config/environment.config';

// CORS options
const corsOptions = {
  origin: config.CORS_ORIGINS.split(','),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-API-Key'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// CORS middleware
export const corsMiddleware = cors(corsOptions);

// Preflight handler for OPTIONS requests
export const handlePreflight = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
};

// Export CORS middleware
export default {
  corsMiddleware,
  handlePreflight,
};
