import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.util';
import { verifyAccessToken } from '../config/jwt.config';
import { UnauthorizedError } from './error.middleware';
import { UserRole } from '../types/common.types';

// Extended request interface with user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
  };
}

// Export as AuthenticateRequest for backward compatibility
export type AuthenticateRequest = AuthRequest;

// Authentication middleware
export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token missing or invalid format');
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      throw new UnauthorizedError('Token expired or invalid');
    }

    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    logger.debug('Authentication successful', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      requestId: (req as any).requestId,
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed:', {
      error: (error as Error).message,
      path: req.path,
      requestId: (req as any).requestId,
    });

    next(error);
  }
};

// Token refresh middleware
export const refreshTokenMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    // Verify refresh token (implementation depends on token service)
    // const decoded = verifyRefreshToken(refreshToken);

    // If valid, generate new access token
    // const newAccessToken = generateAccessToken({ userId: decoded.userId, email: decoded.email, role: decoded.role });

    res.json({
      success: true,
      data: {
        accessToken: 'new_access_token', // Replace with actual token
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Export authentication middleware
export default {
  authenticate,
  refreshTokenMiddleware,
};
