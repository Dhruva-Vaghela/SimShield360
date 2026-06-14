import { z } from 'zod';

/**
 * Register device schema
 */
export const registerDeviceSchema = z.object({
  body: z.object({
    fingerprint: z
      .string({ required_error: 'Device fingerprint is required' })
      .min(32, 'Device fingerprint must be at least 32 characters')
      .max(128, 'Device fingerprint must not exceed 128 characters'),
    deviceName: z
      .string({ required_error: 'Device name is required' })
      .min(2, 'Device name must be at least 2 characters')
      .max(100, 'Device name must not exceed 100 characters')
      .trim(),
    deviceType: z
      .enum(['mobile', 'tablet', 'desktop', 'other'], {
        errorMap: () => ({ message: 'Invalid device type' }),
      }),
    browser: z
      .string()
      .max(50, 'Browser must not exceed 50 characters')
      .optional(),
    os: z
      .string()
      .max(50, 'OS must not exceed 50 characters')
      .optional(),
  }),
});

/**
 * Update device schema
 */
export const updateDeviceSchema = z.object({
  body: z.object({
    deviceName: z
      .string()
      .min(2, 'Device name must be at least 2 characters')
      .max(100, 'Device name must not exceed 100 characters')
      .trim()
      .optional(),
  }),
});

/**
 * Get device by ID schema
 */
export const getDeviceByIdSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Device ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid device ID format'),
  }),
});

export default {
  registerDeviceSchema,
  updateDeviceSchema,
  getDeviceByIdSchema,
};
