import { Request, Response, NextFunction } from 'express';
import { response } from '../utils/response.util';
import { NotificationService } from '../services/notification/notification.service';
import { AuthenticateRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger.util';

const notificationService = new NotificationService();

// Get user notifications
export const getNotifications = async (req: AuthenticateRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page, limit, isRead, type, priority } = req.query;

    const result = await notificationService.getUserNotifications(
      userId,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20,
      isRead === 'true' ? true : isRead === 'false' ? false : undefined
    );

    if (!result.success) {
      response.internalError(res);
      return;
    }

    response.success(res, result.notifications, undefined, {
      page: result.notifications ? (parseInt(page as string) || 1) : 1,
      limit: result.notifications ? (parseInt(limit as string) || 20) : 20,
      total: result.total || 0,
      totalPages: result.total && parseInt(limit as string, 10) > 0 ? Math.ceil(result.total / parseInt(limit as string, 10)) : 0,
      unreadCount: result.unreadCount || 0,
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    response.internalError(res);
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await notificationService.markAsRead(id);

    if (!result.success) {
      response.notFound(res, 'Notification', id);
      return;
    }

    response.success(res, { message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    response.internalError(res);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: AuthenticateRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const result = await notificationService.markAllAsRead(userId);

    if (!result.success) {
      response.internalError(res);
      return;
    }

    response.success(res, {
      message: 'All notifications marked as read',
      markedCount: result.markedCount,
    });
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    response.internalError(res);
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await notificationService.deleteNotification(id);

    if (!result.success) {
      response.notFound(res, 'Notification', id);
      return;
    }

    response.success(res, { message: 'Notification deleted' });
  } catch (error) {
    logger.error('Delete notification error:', error);
    response.internalError(res);
  }
};

// Export all controller functions
export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
