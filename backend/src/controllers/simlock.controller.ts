import { Response, NextFunction } from 'express';
import { AuthenticateRequest } from '../middleware/auth.middleware';
import { response } from '../utils/response.util';
import { SimLockService } from '../services/simlock/simlock.service';
import { AuditService } from '../services/audit/audit.service';
import logger from '../utils/logger.util';

const simlockService = new SimLockService();
const auditService = new AuditService();

/**
 * Get all SIM locks for authenticated user
 */
export const getSimLocks = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const result = await simlockService.getUserSimLocks(userId);

    if (!result.success) {
      response.internalError(res, result.errorMessage);
      return;
    }

    response.success(res, result.simLocks);
  } catch (error) {
    logger.error('Get SIM locks error:', error);
    response.internalError(res);
  }
};

/**
 * Get SIM lock by ID
 */
export const getSimLockById = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await simlockService.getSimLockById(id, userId);

    if (!result.success) {
      response.notFound(res, 'SIM Lock', id);
      return;
    }

    response.success(res, result.simLock);
  } catch (error) {
    logger.error('Get SIM lock by ID error:', error);
    response.internalError(res);
  }
};

/**
 * Create new SIM lock
 */
export const createSimLock = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { phoneNumber, simCardNumber, reason } = req.body;

    const result = await simlockService.createSimLock({
      userId,
      phoneNumber,
      simCardNumber,
      reason,
      initiatedBy: 'user',
    });

    if (!result.success) {
      response.internalError(res, result.errorMessage);
      return;
    }

    // Create audit log
    await auditService.createAuditLog({
      userId,
      action: 'simlock_created',
      resource: 'simlock',
      resourceId: result.simLockId!,
      method: 'POST',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      details: { phoneNumber, simCardNumber },
    });

    response.created(res, {
      simLockId: result.simLockId,
      message: 'SIM lock created successfully',
    });
  } catch (error) {
    logger.error('Create SIM lock error:', error);
    response.internalError(res);
  }
};

/**
 * Enable SIM lock
 */
export const enableSimLock = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { reason } = req.body;

    const result = await simlockService.enableSimLock(id, userId, reason);

    if (!result.success) {
      response.internalError(res, result.errorMessage);
      return;
    }

    // Create audit log
    await auditService.createAuditLog({
      userId,
      action: 'simlock_enabled',
      resource: 'simlock',
      resourceId: id,
      method: 'PUT',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      details: { reason },
    });

    response.success(res, {
      message: 'SIM lock enabled successfully',
      simLock: result.simLock,
    });
  } catch (error) {
    logger.error('Enable SIM lock error:', error);
    response.internalError(res);
  }
};

/**
 * Disable SIM lock
 */
export const disableSimLock = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { reason } = req.body;

    const result = await simlockService.disableSimLock(id, userId, reason);

    if (!result.success) {
      response.internalError(res, result.errorMessage);
      return;
    }

    // Create audit log
    await auditService.createAuditLog({
      userId,
      action: 'simlock_disabled',
      resource: 'simlock',
      resourceId: id,
      method: 'PUT',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      details: { reason },
    });

    response.success(res, {
      message: 'SIM lock disabled successfully',
      simLock: result.simLock,
    });
  } catch (error) {
    logger.error('Disable SIM lock error:', error);
    response.internalError(res);
  }
};

/**
 * Get SIM lock status
 */
export const getSimLockStatus = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await simlockService.getSimLockStatus(id, userId);

    if (!result.success) {
      response.notFound(res, 'SIM Lock', id);
      return;
    }

    response.success(res, {
      status: result.status,
      isLocked: result.isLocked,
      lastModified: result.lastModified,
    });
  } catch (error) {
    logger.error('Get SIM lock status error:', error);
    response.internalError(res);
  }
};

/**
 * Get SIM lock history
 */
export const getSimLockHistory = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await simlockService.getSimLockHistory(id, userId);

    if (!result.success) {
      response.notFound(res, 'SIM Lock', id);
      return;
    }

    response.success(res, result.history);
  } catch (error) {
    logger.error('Get SIM lock history error:', error);
    response.internalError(res);
  }
};

export default {
  getSimLocks,
  getSimLockById,
  createSimLock,
  enableSimLock,
  disableSimLock,
  getSimLockStatus,
  getSimLockHistory,
};
