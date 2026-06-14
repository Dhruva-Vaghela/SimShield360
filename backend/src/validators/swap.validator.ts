import { z } from 'zod';

/**
 * Create swap request schema
 */
export const createSwapRequestSchema = z.object({
  body: z.object({
    currentPhoneNumber: z
      .string({ required_error: 'Current phone number is required' })
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid current phone number format'),
    newPhoneNumber: z
      .string({ required_error: 'New phone number is required' })
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid new phone number format'),
    newSimCardNumber: z
      .string({ required_error: 'New SIM card number is required' })
      .min(15, 'SIM card number must be at least 15 characters')
      .max(22, 'SIM card number must not exceed 22 characters')
      .regex(/^\d+$/, 'SIM card number must contain only digits'),
    reason: z
      .string({ required_error: 'Reason is required' })
      .min(20, 'Reason must be at least 20 characters')
      .max(1000, 'Reason must not exceed 1000 characters'),
    deviceFingerprint: z
      .string()
      .min(32, 'Device fingerprint must be at least 32 characters')
      .optional(),
  }),
});

/**
 * Approve swap request schema
 */
export const approveSwapRequestSchema = z.object({
  body: z.object({
    notes: z
      .string()
      .min(10, 'Notes must be at least 10 characters')
      .max(1000, 'Notes must not exceed 1000 characters')
      .optional(),
  }),
});

/**
 * Reject swap request schema
 */
export const rejectSwapRequestSchema = z.object({
  body: z.object({
    reason: z
      .string({ required_error: 'Rejection reason is required' })
      .min(20, 'Rejection reason must be at least 20 characters')
      .max(1000, 'Rejection reason must not exceed 1000 characters'),
  }),
});

/**
 * Get swap request by ID schema
 */
export const getSwapRequestByIdSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Swap request ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid swap request ID format'),
  }),
});

/**
 * List swap requests schema
 */
export const listSwapRequestsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .transform(Number)
      .refine((val) => val > 0, 'Page must be greater than 0')
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .transform(Number)
      .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
      .optional(),
    status: z
      .enum([
        'pending',
        'processing',
        'approved',
        'rejected',
        'cancelled',
        'pending_review',
      ])
      .optional(),
  }),
});

export default {
  createSwapRequestSchema,
  approveSwapRequestSchema,
  rejectSwapRequestSchema,
  getSwapRequestByIdSchema,
  listSwapRequestsSchema,
};
