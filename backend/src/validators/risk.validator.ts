import { z } from 'zod';

/**
 * Get risk logs schema
 */
export const getRiskLogsSchema = z.object({
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
    riskLevel: z
      .enum(['low', 'medium', 'high', 'critical'])
      .optional(),
    decision: z
      .enum(['approved', 'rejected', 'blocked', 'pending_review'])
      .optional(),
  }),
});

/**
 * Get risk analytics schema
 */
export const getRiskAnalyticsSchema = z.object({
  query: z.object({
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), 'Invalid start date')
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), 'Invalid end date')
      .optional(),
  }),
});

/**
 * Simulate risk assessment schema
 */
export const simulateRiskSchema = z.object({
  body: z.object({
    phoneNumber: z
      .string({ required_error: 'Phone number is required' })
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    newPhoneNumber: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid new phone number format')
      .optional(),
    deviceFingerprint: z
      .string()
      .min(32, 'Device fingerprint must be at least 32 characters')
      .optional(),
    simLockStatus: z.boolean().optional(),
    faceVerificationScore: z
      .number()
      .min(0)
      .max(100)
      .optional(),
    authenticatorVerified: z.boolean().optional(),
    trustedDevice: z.boolean().optional(),
  }),
});

export default {
  getRiskLogsSchema,
  getRiskAnalyticsSchema,
  simulateRiskSchema,
};
