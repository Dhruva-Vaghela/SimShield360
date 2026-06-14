import { z } from 'zod';

/**
 * Register schema
 */
export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number and special character'
      ),
    confirmPassword: z.string({ required_error: 'Confirm password is required' }),
    profile: z.object({
      firstName: z
        .string({ required_error: 'First name is required' })
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must not exceed 50 characters')
        .trim(),
      lastName: z
        .string({ required_error: 'Last name is required' })
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must not exceed 50 characters')
        .trim(),
      phoneNumber: z
        .string({ required_error: 'Phone number is required' })
        .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
      dateOfBirth: z
        .string()
        .optional()
        .refine(
          (val) => !val || !isNaN(Date.parse(val)),
          'Invalid date format'
        ),
      address: z
        .object({
          street: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          country: z.string().optional(),
        })
        .optional(),
    }),
    role: z.enum(['customer', 'agent', 'admin']).optional(),
  }),
});

/**
 * Login schema
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  }),
});

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ required_error: 'Refresh token is required' })
      .min(1, 'Refresh token is required'),
  }),
});

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
  }),
});

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z
      .string({ required_error: 'Reset token is required' })
      .min(1, 'Reset token is required'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number and special character'
      ),
    confirmPassword: z.string({ required_error: 'Confirm password is required' }),
  }),
});

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
  body: z.object({
    profile: z
      .object({
        firstName: z
          .string()
          .min(2, 'First name must be at least 2 characters')
          .max(50, 'First name must not exceed 50 characters')
          .trim()
          .optional(),
        lastName: z
          .string()
          .min(2, 'Last name must be at least 2 characters')
          .max(50, 'Last name must not exceed 50 characters')
          .trim()
          .optional(),
        phoneNumber: z
          .string()
          .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
          .optional(),
        dateOfBirth: z
          .string()
          .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format')
          .optional(),
        address: z
          .object({
            street: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zipCode: z.string().optional(),
            country: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  }),
});

/**
 * Verify authenticator schema
 */
export const verifyAuthenticatorSchema = z.object({
  body: z.object({
    token: z
      .string({ required_error: 'TOTP token is required' })
      .length(6, 'TOTP token must be 6 digits')
      .regex(/^\d{6}$/, 'TOTP token must contain only digits'),
  }),
});

export default {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyAuthenticatorSchema,
};
