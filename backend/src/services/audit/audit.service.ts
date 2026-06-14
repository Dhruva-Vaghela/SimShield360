import { AuditLog } from '../../models/AuditLog.model';
import logger from '../../utils/logger.util';

export interface CreateAuditLogData {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  method: string;
  ipAddress: string;
  userAgent: string;
  details?: any;
}

export interface AuditServiceResult {
  success: boolean;
  auditLog?: any;
  auditLogs?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errorMessage?: string;
}

export class AuditService {
  /**
   * Create audit log entry
   */
  async createAuditLog(data: CreateAuditLogData): Promise<AuditServiceResult> {
    try {
      const auditLog = new AuditLog({
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        method: data.method,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        details: data.details || {},
        timestamp: new Date(),
      });

      await auditLog.save();

      return {
        success: true,
        auditLog: auditLog.toObject(),
      };
    } catch (error) {
      logger.error('Create audit log error:', error);
      return {
        success: false,
        errorMessage: 'Failed to create audit log',
      };
    }
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<AuditServiceResult> {
    try {
      const {
        userId,
        action,
        resource,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = filters;

      const query: any = {};

      if (userId) query.userId = userId;
      if (action) query.action = action;
      if (resource) query.resource = resource;
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }

      const total = await AuditLog.countDocuments(query);
      const auditLogs = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      return {
        success: true,
        auditLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get audit logs error:', error);
      return {
        success: false,
        errorMessage: 'Failed to retrieve audit logs',
      };
    }
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<AuditServiceResult> {
    return this.getAuditLogs({ userId, page, limit });
  }

  /**
   * Get audit logs for a resource
   */
  async getResourceAuditLogs(
    resource: string,
    resourceId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<AuditServiceResult> {
    try {
      const total = await AuditLog.countDocuments({ resource, resourceId });
      const auditLogs = await AuditLog.find({ resource, resourceId })
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      return {
        success: true,
        auditLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get resource audit logs error:', error);
      return {
        success: false,
        errorMessage: 'Failed to retrieve resource audit logs',
      };
    }
  }
}

export default AuditService;
