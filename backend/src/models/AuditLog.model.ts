import { Schema, Document, model, Types } from 'mongoose';

// Types
export interface IAuditLog {
  userId?: Types.ObjectId;
  agentId?: Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  ipAddress: string;
  userAgent?: string;
  requestBody?: Record<string, unknown>;
  responseStatus?: number;
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  timestamp: Date;
  createdAt: Date;
}

// Custom document interface
export interface IAuditLogDocument extends IAuditLog, Document {
  _id: any;
}

// AuditLog Schema
const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    resourceId: {
      type: String,
      index: true,
    },
    method: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
    ipAddress: {
      type: String,
      required: true,
      trim: true,
      match: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    requestBody: {
      type: Schema.Types.Mixed,
      select: false,
    },
    responseStatus: {
      type: Number,
      min: 100,
      max: 599,
    },
    changes: {
      before: { type: Schema.Types.Mixed, select: false },
      after: { type: Schema.Types.Mixed, select: false },
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
    versionKey: false,
    id: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.requestBody;
        return ret;
      },
    },
    toObject: {
      transform: (_, ret) => {
        delete ret.requestBody;
        return ret;
      },
    },
  }
);

// Compound index for user activity
auditLogSchema.index({ userId: 1, timestamp: -1 });

// Compound index for agent actions
auditLogSchema.index({ agentId: 1, timestamp: -1 });

// Compound index for resource queries
auditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });

// Compound index for action queries
auditLogSchema.index({ action: 1, timestamp: -1 });

// Compound index for comprehensive search
auditLogSchema.index({ userId: 1, agentId: 1, timestamp: -1 });

// TTL index for automatic cleanup after 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static: Create audit log entry
auditLogSchema.statics.createEntry = async function (data: {
  userId?: string;
  agentId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  ipAddress: string;
  userAgent?: string;
  requestBody?: Record<string, unknown>;
  responseStatus?: number;
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
}): Promise<IAuditLogDocument> {
  return this.create(data);
};

// Static: Get user activity logs
auditLogSchema.statics.getUserActivityLogs = async function (
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .skip(offset)
    .limit(limit)
    .exec();
};

// Static: Get agent activity logs
auditLogSchema.statics.getAgentActivityLogs = async function (
  agentId: string,
  limit: number = 50,
  offset: number = 0
) {
  return this.find({ agentId })
    .sort({ timestamp: -1 })
    .skip(offset)
    .limit(limit)
    .exec();
};

// Static: Get resource audit logs
auditLogSchema.statics.getResourceAuditLogs = async function (
  resource: string,
  resourceId: string,
  limit: number = 20
) {
  return this.find({ resource, resourceId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
};

// Static: Get audit logs by action
auditLogSchema.statics.getByAction = async function (
  action: string,
  limit: number = 50,
  offset: number = 0
) {
  return this.find({ action })
    .sort({ timestamp: -1 })
    .skip(offset)
    .limit(limit)
    .exec();
};

// Static: Export audit logs
auditLogSchema.statics.exportLogs = async function (
  startDate: Date,
  endDate: Date,
  filters?: {
    userId?: string;
    agentId?: string;
    resource?: string;
    action?: string;
  }
) {
  const query: Record<string, unknown> = {
    timestamp: { $gte: startDate, $lte: endDate },
  };

  if (filters?.userId) query.userId = filters.userId;
  if (filters?.agentId) query.agentId = filters.agentId;
  if (filters?.resource) query.resource = filters.resource;
  if (filters?.action) query.action = filters.action;

  return this.find(query).sort({ timestamp: 1 }).exec();
};

// Static: Get recent critical actions
auditLogSchema.statics.getCriticalActions = async function (limit: number = 20) {
  const criticalActions = [
    'swap_request_approved',
    'swap_request_denied',
    'sim_lock_enabled',
    'sim_lock_disabled',
    'user_login',
    'user_logout',
    'user_created',
    'user_deleted',
  ];

  return this.find({ action: { $in: criticalActions } })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
};

// Export AuditLog model
export const AuditLog = model<IAuditLogDocument>('AuditLog', auditLogSchema);
