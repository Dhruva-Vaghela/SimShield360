import { z } from 'zod';

// Get audit logs schema
export const getAuditLogsSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  userId: z.string().uuid('Invalid user ID').optional(),
  agentId: z.string().uuid('Invalid agent ID').optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type GetAuditLogsInput = z.infer<typeof getAuditLogsSchema>;

// Export all validators
export default {
  getAuditLogsSchema,
};
