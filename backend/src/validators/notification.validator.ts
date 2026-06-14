import { z } from 'zod';

// Get notifications schema
export const getNotificationsSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  isRead: z.boolean().optional(),
  type: z.string().optional(),
  priority: z.string().optional(),
});

export type GetNotificationsInput = z.infer<typeof getNotificationsSchema>;

// Mark as read schema
export const markAsReadSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
});

export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;

// Delete notification schema
export const deleteNotificationSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
});

export type DeleteNotificationInput = z.infer<typeof deleteNotificationSchema>;

// Export all validators
export default {
  getNotificationsSchema,
  markAsReadSchema,
  deleteNotificationSchema,
};
