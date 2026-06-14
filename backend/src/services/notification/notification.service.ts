import { Notification, INotificationDocument } from '../../models/Notification.model';
import { User } from '../../models/User.model';
import logger from '../../utils/logger.util';

export class NotificationService {
  async createNotification(data: {
    userId: string;
    type: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; notificationId?: string }> {
    try {
      const notification = await Notification.create(data);
      return { success: true, notificationId: notification._id.toString() };
    } catch (error) {
      logger.error('Notification creation error:', error);
      return { success: false };
    }
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    readStatus?: boolean
  ): Promise<{ success: boolean; notifications?: any[]; total?: number; unreadCount?: number }> {
    try {
      const query: any = { userId };
      if (readStatus !== undefined) query.isRead = readStatus;

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Notification.countDocuments({ userId }),
        Notification.countDocuments({ userId, isRead: false }),
      ]);

      return {
        success: true,
        notifications: notifications.map((n: any) => ({
          id: n._id.toString(),
          type: n.type,
          priority: n.priority,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          readAt: n.readAt,
          createdAt: n.createdAt,
        })),
        total,
        unreadCount,
      };
    } catch (error) {
      logger.error('Get user notifications error:', error);
      return { success: false };
    }
  }

  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    try {
      await Notification.findByIdAndUpdate(notificationId, { isRead: true, readAt: new Date() });
      return { success: true };
    } catch (error) {
      logger.error('Mark notification as read error:', error);
      return { success: false };
    }
  }

  async markAllAsRead(userId: string): Promise<{ success: boolean; markedCount?: number }> {
    try {
      const result = await Notification.updateMany({ userId, isRead: false }, { isRead: true, readAt: new Date() });
      return { success: true, markedCount: result.modifiedCount };
    } catch (error) {
      logger.error('Mark all notifications as read error:', error);
      return { success: false };
    }
  }

  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    try {
      await Notification.findByIdAndDelete(notificationId);
      return { success: true };
    } catch (error) {
      logger.error('Delete notification error:', error);
      return { success: false };
    }
  }
}

export default NotificationService;
