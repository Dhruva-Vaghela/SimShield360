import { Response, NextFunction } from 'express';
import { response } from '../utils/response.util';
import { AuditService } from '../services/audit/audit.service';
import { AuthenticateRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger.util';

const auditService = new AuditService();

// List audit logs
export const listAuditLogs = async (req: AuthenticateRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { page, limit, userId, resource, action, startDate, endDate } = req.query;

    const result = await auditService.getAuditLogs({
      userId: userId as string,
      resource: resource as string,
      action: action as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20,
    });

    if (!result.success) {
      response.internalError(res);
      return;
    }

    response.successWithPagination(res, result.auditLogs!, {
      page: result.pagination!.page,
      limit: result.pagination!.limit,
      total: result.pagination!.total,
      totalPages: result.pagination!.totalPages,
    });
  } catch (error) {
    logger.error('List audit logs error:', error);
    response.internalError(res);
  }
};

// Get user activity logs
export const getUserActivityLogs = async (req: AuthenticateRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { page, limit } = req.query;

    const result = await auditService.getUserAuditLogs(
      userId,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 50
    );

    if (!result.success) {
      response.internalError(res);
      return;
    }

    response.successWithPagination(res, result.auditLogs!, {
      page: result.pagination!.page,
      limit: result.pagination!.limit,
      total: result.pagination!.total,
      totalPages: result.pagination!.totalPages,
    });
  } catch (error) {
    logger.error('Get user activity logs error:', error);
    response.internalError(res);
  }
};

// Export audit logs (simplified - returns JSON)
export const exportAuditLogs = async (req: AuthenticateRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, userId, resource, action } = req.query;

    const result = await auditService.getAuditLogs({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      userId: userId as string,
      resource: resource as string,
      action: action as string,
      limit: 1000,
    });

    if (!result.success) {
      response.internalError(res);
      return;
    }

    response.success(res, result.auditLogs);
  } catch (error) {
    logger.error('Export audit logs error:', error);
    response.internalError(res);
  }
};

export default {
  listAuditLogs,
  getUserActivityLogs,
  exportAuditLogs,
};
