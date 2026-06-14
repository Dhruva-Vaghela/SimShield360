import { z } from 'zod';

/**
 * Create SIM lock schema
 */
export const createSimLockSchema = z.object({
  body: z.object({
    phoneNumber: z
      .string({ required_error: 'Phone number is required' })
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    simCardNumber: z
      .string({ required_error: 'SIM card number is required' })
      .min(15, 'SIM card number must be at least 15 characters')
      .max(22, 'SIM card number must not exceed 22 characters')
      .regex(/^\d+$/, 'SIM card number must contain only digits'),
    reason: z
      .string()
      .min(10, 'Reason must be at least 10 characters')
      .max(500, 'Reason must not exceed 500 characters')
      .optional(),
  }),
});

/**
 * Update SIM lock status schema
 */
export const updateSimLockStatusSchema = z.object({
  body: z.object({
    reason: z
      .string()
      .min(10, 'Reason must be at least 10 characters')
      .max(500, 'Reason must not exceed 500 characters')
      .optional(),
  }),
});

/**
 * Get SIM lock by ID schema
 */
export const getSimLockByIdSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'SIM lock ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid SIM lock ID format'),
  }),
});

export default {
  createSimLockSchema,
  updateSimLockStatusSchema,
  getSimLockByIdSchema,
};
