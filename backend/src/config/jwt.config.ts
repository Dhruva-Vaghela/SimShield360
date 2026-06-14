import jwt from 'jsonwebtoken';
import logger from '../utils/logger.util';

// JWT configuration
export interface JwtConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

// Load configuration from environment
const config: JwtConfig = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'default-access-secret-change-in-production',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
};

// Validate configuration
if (process.env.NODE_ENV === 'production') {
  if (config.accessTokenSecret === 'default-access-secret-change-in-production') {
    logger.warn('JWT: Using default access secret - change in production!');
  }
  if (config.refreshTokenSecret === 'default-refresh-secret-change-in-production') {
    logger.warn('JWT: Using default refresh secret - change in production!');
  }
}

// Token payload interface
export interface JwtPayload {
  userId: string;
  email: string;
  role: 'customer' | 'agent' | 'admin';
  iat?: number;
  exp?: number;
}

// Token responses
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// Refresh token payload
export interface RefreshTokenPayload {
  userId: string;
  iat: number;
  exp: number;
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    },
    config.accessTokenSecret,
    {
      expiresIn: config.accessTokenExpiry,
    } as jwt.SignOptions
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    },
    config.refreshTokenSecret,
    {
      expiresIn: config.refreshTokenExpiry,
    } as jwt.SignOptions
  );
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, config.accessTokenSecret) as JwtPayload;
    return decoded;
  } catch (error) {
    logger.warn('Access token verification failed:', (error as jwt.JsonWebTokenError).message);
    return null;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, config.refreshTokenSecret) as RefreshTokenPayload;
    return decoded;
  } catch (error) {
    logger.warn('Refresh token verification failed:', (error as jwt.JsonWebTokenError).message);
    return null;
  }
};

/**
 * Decode token without verification (for preview)
 */
export const decodeToken = (token: string): JwtPayload | RefreshTokenPayload | null => {
  try {
    const decoded = jwt.decode(token) as JwtPayload | RefreshTokenPayload;
    return decoded;
  } catch (error) {
    logger.error('Token decoding failed:', error as Error);
    return null;
  }
};

// Export configuration
export default config;
