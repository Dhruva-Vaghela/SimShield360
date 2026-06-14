import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import * as notificationValidator from '../validators/notification.validator';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { globalLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Get user notifications
router.get('/', authenticate, globalLimiter, notificationController.getNotifications);

// Mark notification as read
router.put('/:id/read', authenticate, validateBody(notificationValidator.markAsReadSchema), notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', authenticate, notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', authenticate, notificationController.deleteNotification);

// Export router
export default router;
