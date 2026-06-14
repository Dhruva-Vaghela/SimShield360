import { Schema, Document, model, Types, Model } from 'mongoose';

// Types
export type NotificationType =
  | 'swap_request_created'
  | 'swap_approved'
  | 'swap_denied'
  | 'sim_locked'
  | 'sim_unlocked'
  | 'suspicious_activity'
  | 'device_trusted'
  | 'verification_required'
  | 'manual_review_required'
  | 'risk_alert';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface INotification {

  userId: Types.ObjectId;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

// Custom document interface
export interface INotificationDocument extends INotification, Document { _id: any; }

export interface INotificationModel extends Model<INotificationDocument> {
  getUserNotifications?(userId: string, limit?: number, offset?: number, readStatus?: boolean): Promise<INotificationDocument[]>;
  getUnreadCount?(userId: string): Promise<number>;
  getUrgentUnreadNotifications?(userId: string): Promise<INotificationDocument[]>;
  markAsRead?(notificationId: string): Promise<void>;
  markAllAsRead?(userId: string): Promise<void>;
  createNotification(data: {
    userId: string;
    type: NotificationType;
    priority?: NotificationPriority;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<INotificationDocument>;
  createSwapRequestNotification?(userId: string, requestId: string, status: string): Promise<INotificationDocument>;
  createSimLockNotification?(userId: string, isLocked: boolean, iccid: string): Promise<INotificationDocument>;
  createRiskAlertNotification?(userId: string, riskLevel: 'low' | 'medium' | 'high' | 'critical', requestId: string): Promise<INotificationDocument>;
}

// Notification Schema
const notificationSchema = new Schema<INotificationDocument, INotificationModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'swap_request_created',
        'swap_approved',
        'swap_denied',
        'sim_locked',
        'sim_unlocked',
        'suspicious_activity',
        'device_trusted',
        'verification_required',
        'manual_review_required',
        'risk_alert',
      ],
    },
    priority: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    metadata: {
      type: Schema.Types.Mixed,
      select: false,
    },
    isRead: {
      type: Boolean,
      required: true,
      default: false,
    },
    readAt: {
      type: Date,
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
        delete ret.metadata;
        return ret;
      },
    },
    toObject: {
      transform: (_, ret) => {
        delete ret.metadata;
        return ret;
      },
    },
  }
);

// Compound index for user notifications
notificationSchema.index({ userId: 1, createdAt: -1 });

// Compound index for unread notifications
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// Compound index for priority queries
notificationSchema.index({ userId: 1, priority: 1, isRead: 1, createdAt: -1 });

// Compound index for type queries
notificationSchema.index({ userId: 1, type: 1, isRead: 1, createdAt: -1 });

// Static: Get user notifications
notificationSchema.statics.getUserNotifications = async function (
  userId: string,
  limit: number = 20,
  offset: number = 0,
  readStatus?: boolean
) {
  const query: Record<string, unknown> = { userId };
  if (readStatus !== undefined) {
    query.isRead = readStatus;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .exec();
};

// Static: Get unread notification count
notificationSchema.statics.getUnreadCount = async function (userId: string): Promise<number> {
  return this.countDocuments({ userId, isRead: false }).exec();
};

// Static: Get unread urgent notifications
notificationSchema.statics.getUrgentUnreadNotifications = async function (userId: string) {
  return this.find({
    userId,
    priority: 'urgent',
    isRead: false,
  }).exec();
};

// Static: Mark notification as read
notificationSchema.statics.markAsRead = async function (notificationId: string): Promise<void> {
  await this.findByIdAndUpdate(notificationId, {
    isRead: true,
    readAt: new Date(),
  }).exec();
};

// Static: Mark all as read
notificationSchema.statics.markAllAsRead = async function (userId: string): Promise<void> {
  await this.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  ).exec();
};

// Static: Create notification
notificationSchema.statics.createNotification = async function (data: {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<INotificationDocument> {
  return this.create(data);
};

// Static: Create notification for swap request
notificationSchema.statics.createSwapRequestNotification = async function (
  userId: string,
  requestId: string,
  status: string
): Promise<INotificationDocument> {
  const metadata = { requestId, status };
  let type: NotificationType;
  let title: string;
  let message: string;
  let priority: NotificationPriority;

  switch (status) {
    case 'approved':
      type = 'swap_approved';
      title = 'SIM Swap Request Approved';
      message = 'Your SIM swap request has been approved.';
      priority = 'low';
      break;
    case 'denied':
      type = 'swap_denied';
      title = 'SIM Swap Request Denied';
      message = 'Your SIM swap request has been denied.';
      priority = 'high';
      break;
    case 'layer7_pending_manual':
      type = 'manual_review_required';
      title = 'Manual Review Required';
      message = 'Your SIM swap request requires manual review by an agent.';
      priority = 'medium';
      break;
    default:
      type = 'swap_request_created';
      title = 'SIM Swap Request Created';
      message = 'Your SIM swap request has been created.';
      priority = 'low';
  }

  return this.createNotification({ userId, type, priority, title, message, metadata });
};

// Static: Create notification for SIM lock change
notificationSchema.statics.createSimLockNotification = async function (
  userId: string,
  isLocked: boolean,
  iccid: string
): Promise<INotificationDocument> {
  const type = isLocked ? 'sim_locked' : 'sim_unlocked';
  const title = isLocked ? 'SIM Lock Enabled' : 'SIM Lock Disabled';
  const message = isLocked
    ? `SIM lock has been enabled for SIM ${iccid}.`
    : `SIM lock has been disabled for SIM ${iccid}.`;
  const priority = isLocked ? 'medium' : 'low';

  return this.createNotification({ userId, type, priority, title, message });
};

// Static: Create risk alert notification
notificationSchema.statics.createRiskAlertNotification = async function (
  userId: string,
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  requestId: string
): Promise<INotificationDocument> {
  const title = `Risk Alert: ${riskLevel.toUpperCase()} Risk Level`;
  const message = `A ${riskLevel} risk level was detected for request ${requestId}.`;
  const priority: NotificationPriority =
    riskLevel === 'critical' ? 'urgent' : riskLevel === 'high' ? 'high' : riskLevel === 'medium' ? 'medium' : 'low';

  return this.createNotification({
    userId,
    type: 'risk_alert',
    priority,
    title,
    message,
    metadata: { riskLevel, requestId },
  });
};

// Method: Mark as read
notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
};

// Export Notification model
export const Notification = model<INotificationDocument, INotificationModel>('Notification', notificationSchema);
