import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import config from './config/environment.config';
import logger from './utils/logger.util';

// Import routes (to be implemented)
// import authRoutes from './routes/auth.routes';
// import simLockRoutes from './routes/simlock.routes';
// import swapRoutes from './routes/swap.routes';
// import verificationRoutes from './routes/verification.routes';
// import riskRoutes from './routes/risk.routes';
// import auditRoutes from './routes/audit.routes';
// import deviceRoutes from './routes/device.routes';
// import notificationRoutes from './routes/notification.routes';

// Create Express app
const app: Application = express();

// Middleware
// 1. Security middleware (must be first)
app.use(helmet());

// 2. CORS middleware
app.use(
  cors({
    origin: config.CORS_ORIGINS.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    maxAge: 86400,
  })
);

// 3. Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Request logging
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    })
  );
}

// 5. Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS, 10),
  max: parseInt(config.RATE_LIMIT_MAX, 10),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all requests
app.use(limiter);

// 6. MongoDB query sanitization
app.use(mongoSanitize());

// 7. Request ID middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  const requestId = _req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', requestId);
  (_req as any).requestId = requestId;
  next();
});

// 8. Request timeout middleware
const REQUEST_TIMEOUT = 30000; // 30 seconds
app.use((_req: Request, res: Response, next: NextFunction) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        error: {
          code: 'REQUEST_TIMEOUT',
          message: 'Request timeout',
        },
      });
    }
  }, REQUEST_TIMEOUT);

  res.on('finish', () => clearTimeout(timeout));
  res.on('close', () => clearTimeout(timeout));

  next();
});

// API routes prefix
app.use(config.API_PREFIX, (req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip, requestId: (req as any).requestId });
  next();
});

// Import and mount routes
import routes from './routes';
app.use(config.API_PREFIX, routes);

// Health check endpoint (before auth)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'SIMShield 360 API is running',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'SIMShield 360 Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: `${config.API_PREFIX}/auth/*`,
      simlock: `${config.API_PREFIX}/simlocks/*`,
      swaps: `${config.API_PREFIX}/swap-requests/*`,
      verification: `${config.API_PREFIX}/verification/*`,
      risk: `${config.API_PREFIX}/risk/*`,
      audit: `${config.API_PREFIX}/audit/*`,
      devices: `${config.API_PREFIX}/devices/*`,
      notifications: `${config.API_PREFIX}/notifications/*`,
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.path} not found`,
    },
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);

  // Don't leak error details in production
  const message = config.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  });
});

// Export app
export default app;
