import { Response, NextFunction } from 'express';
import { Permissions, UserRole } from '../types/common.types';
import { UnauthorizedError, ForbiddenError } from './error.middleware';
import { AuthRequest } from './auth.middleware';
import logger from '../utils/logger.util';

// Role permissions mapping
const rolePermissions: Record<UserRole, readonly string[]> = {
  customer: Permissions.customer,
  agent: Permissions.agent,
  admin: Permissions.admin,
};

// Authorization middleware factory
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // Check if user has one of the required roles
      const userRole = req.user.role;
      const allowedRoles = roles;

      if (!allowedRoles.includes(userRole)) {
        logger.warn('Authorization failed - insufficient permissions', {
          userId: req.user.id,
          requiredRoles: allowedRoles,
          userRole,
          path: req.path,
          requestId: (req as any).requestId,
        });

        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Permission-based authorization middleware
export const authorizePermission = (...permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const userRole = req.user.role;
      const userPermissions = rolePermissions[userRole];

      // Admin has all permissions
      if (userRole === 'admin') {
        next();
        return;
      }

      // Check if user has required permissions
      const hasPermission = permissions.every((perm) => userPermissions.includes(perm));

      if (!hasPermission) {
        logger.warn('Authorization failed - insufficient permissions', {
          userId: req.user.id,
          requiredPermissions: permissions,
          userPermissions,
          path: req.path,
          requestId: (req as any).requestId,
        });

        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user owns a resource
export const authorizeOwnership = (userIdField: string = 'userId') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // Get resource owner ID from request
      const resourceOwnerId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];

      // Allow if user is the owner or an admin
      if (req.user.id === resourceOwnerId || req.user.role === 'admin') {
        next();
        return;
      }

      logger.warn('Authorization failed - ownership check', {
        userId: req.user.id,
        resourceOwnerId,
        path: req.path,
        requestId: (req as any).requestId,
      });

      throw new ForbiddenError('Insufficient permissions');
    } catch (error) {
      next(error);
    }
  };
};

// Role-based middleware for common patterns
export const adminOnly = authorize('admin');
export const agentOrAdmin = authorize('agent', 'admin');
export const customerOnly = authorize('customer');
export const customerOrAgent = authorize('customer', 'agent');

// Alias for requireRole (for consistency with route definitions)
export const requireRole = authorize;

// Export all middleware
export default {
  authorize,
  requireRole,
  authorizePermission,
  authorizeOwnership,
  adminOnly,
  agentOrAdmin,
  customerOnly,
  customerOrAgent,
};
