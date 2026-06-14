import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Environment validation
interface EnvironmentConfig {
  // Application
  NODE_ENV: string;
  PORT: string;
  API_PREFIX: string;

  // Database
  MONGODB_URI: string;
  MONGODB_DB_NAME: string;
  MONGODB_POOL_SIZE: string;
  MONGODB_POOL_MAX: string;

  // JWT
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: string;
  RATE_LIMIT_MAX: string;
  AUTH_RATE_LIMIT_WINDOW_MS: string;
  AUTH_RATE_LIMIT_MAX: string;

  // Redis (optional)
  REDIS_URL?: string;
  REDIS_PASSWORD?: string;

  // Face API (optional)
  FACE_API_ENDPOINT?: string;
  FACE_API_KEY?: string;
  FACE_API_TIMEOUT: string;

  // Email (optional)
  SENDGRID_API_KEY?: string;
  EMAIL_FROM?: string;

  // SMS (optional)
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;

  // Logging
  LOG_LEVEL: string;
  LOG_FORMAT: string;
  LOG_OUTPUT: string;

  // Security
  CORS_ORIGINS: string;
  SECURE_COOKIES: string;

  // Feature flags
  ENABLE_RISK_SCORING: string;
  ENABLE_AUDIT_LOGGING: string;
  ENABLE_ANALYTICS: string;

  // Telecom API (optional)
  TELECOM_API_ENDPOINT?: string;
  TELECOM_API_KEY?: string;
}

// Environment configuration
const config: EnvironmentConfig = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '3000',
  API_PREFIX: process.env.API_PREFIX || '/api/v1',

  // Database
  MONGODB_URI: process.env.MONGODB_URI || '',
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'simshield',
  MONGODB_POOL_SIZE: process.env.MONGODB_POOL_SIZE || '10',
  MONGODB_POOL_MAX: process.env.MONGODB_POOL_MAX || '20',

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000',
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || '100',
  AUTH_RATE_LIMIT_WINDOW_MS: process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000',
  AUTH_RATE_LIMIT_MAX: process.env.AUTH_RATE_LIMIT_MAX || '5',

  // Redis (optional)
  REDIS_URL: process.env.REDIS_URL,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,

  // Face API (optional)
  FACE_API_ENDPOINT: process.env.FACE_API_ENDPOINT,
  FACE_API_KEY: process.env.FACE_API_KEY,
  FACE_API_TIMEOUT: process.env.FACE_API_TIMEOUT || '5000',

  // Email (optional)
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@simshield360.com',

  // SMS (optional)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'combined',
  LOG_OUTPUT: process.env.LOG_OUTPUT || 'console',

  // Security
  CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:3000',
  SECURE_COOKIES: process.env.SECURE_COOKIES || 'false',

  // Feature flags
  ENABLE_RISK_SCORING: process.env.ENABLE_RISK_SCORING || 'true',
  ENABLE_AUDIT_LOGGING: process.env.ENABLE_AUDIT_LOGGING || 'true',
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS || 'true',

  // Telecom API (optional)
  TELECOM_API_ENDPOINT: process.env.TELECOM_API_ENDPOINT,
  TELECOM_API_KEY: process.env.TELECOM_API_KEY,
};

// Validation function
const validateConfig = (): void => {
  const errors: string[] = [];

  // Required environment variables
  if (!config.MONGODB_URI) {
    errors.push('MONGODB_URI is required');
  }
  if (!config.JWT_ACCESS_SECRET) {
    errors.push('JWT_ACCESS_SECRET is required');
  }
  if (!config.JWT_REFRESH_SECRET) {
    errors.push('JWT_REFRESH_SECRET is required');
  }

  // Validate port
  const port = parseInt(config.PORT, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a valid port number (1-65535)');
  }

  // Validate NODE_ENV
  if (!['development', 'staging', 'production'].includes(config.NODE_ENV)) {
    errors.push('NODE_ENV must be one of: development, staging, production');
  }

  if (errors.length > 0) {
    throw new Error(`Environment configuration errors:\n${errors.join('\n')}`);
  }
};

// Validate configuration on load
validateConfig();

// Log configuration (with sensitive data masked)
const logConfig = (): void => {
  if (config.NODE_ENV === 'production') {
    console.log('Environment: PRODUCTION');
    console.log('Port:', config.PORT);
    console.log('API Prefix:', config.API_PREFIX);
    console.log('MongoDB URI: ***');
    console.log('Redis: ', config.REDIS_URL ? 'configured' : 'not configured');
  } else {
    console.log('Environment:', config.NODE_ENV);
    console.log('Port:', config.PORT);
    console.log('API Prefix:', config.API_PREFIX);
    console.log('MongoDB URI:', config.MONGODB_URI);
    console.log('Redis:', config.REDIS_URL || 'not configured');
  }
};

// Export configuration
export default config;

// Export log function for server initialization
export { logConfig };
