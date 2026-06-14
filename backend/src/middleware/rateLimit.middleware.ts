import rateLimit from 'express-rate-limit';
import config from '../config/environment.config';

// Global rate limiter
export const globalLimiter = rateLimit({
  windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(config.RATE_LIMIT_MAX || '100', 10),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

// Authentication rate limiter (stricter)
export const authRateLimiter = rateLimit({
  windowMs: parseInt(config.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(config.AUTH_RATE_LIMIT_MAX || '5', 10),
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const path = req.path;
    return `${ip}:${path}`;
  },
  // Store failed attempts in memory (for production, use Redis)
  // store: new RedisStore(),
});

// Swap request rate limiter
export const swapRequestRateLimiter = rateLimit({
  windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS || '900000', 10) * 4, // 1 hour
  max: 5,
  message: {
    success: false,
    error: {
      code: 'SWAP_REQUEST_RATE_LIMIT_EXCEEDED',
      message: 'You have reached the maximum number of swap requests allowed. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as any).user?.id;
    return userId || req.ip || 'unknown';
  },
});

// Custom rate limiter factory
export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  keyPrefix?: string;
}) => {
  const defaults = {
    windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(config.RATE_LIMIT_MAX || '100', 10),
    message: 'Too many requests, please try again later.',
    keyPrefix: '',
  };

  const opts = { ...defaults, ...options };

  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: opts.message,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const userId = (req as any).user?.id;
      return opts.keyPrefix ? `${opts.keyPrefix}:${userId || req.ip}` : userId || req.ip || 'unknown';
    },
  });
};

// Export all rate limiters
export default {
  globalLimiter,
  authRateLimiter,
  swapRequestRateLimiter,
  createRateLimiter,
};
