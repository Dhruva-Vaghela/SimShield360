import { z } from 'zod';

// Face verification schema (simulation-based)
export const faceVerificationSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
  simulationResult: z.enum(['match', 'no_match'], {
    errorMap: () => ({ message: 'Simulation result must be "match" or "no_match"' }),
  }),
});

export type FaceVerificationInput = z.infer<typeof faceVerificationSchema>;

// Authenticator verification schema
export const authenticatorVerificationSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
  code: z.string().min(6, 'TOTP code must be 6 digits').max(6),
});

export type AuthenticatorVerificationInput = z.infer<typeof authenticatorVerificationSchema>;

// Enable authenticator schema
export const enableAuthenticatorSchema = z.object({
  secret: z.string().min(1, 'Secret is required'),
  code: z.string().min(6, 'TOTP code must be 6 digits').max(6),
});

export type EnableAuthenticatorInput = z.infer<typeof enableAuthenticatorSchema>;

// Disable authenticator schema
export const disableAuthenticatorSchema = z.object({
  code: z.string().min(6, 'TOTP code must be 6 digits').max(6),
});

export type DisableAuthenticatorInput = z.infer<typeof disableAuthenticatorSchema>;

// Device consent schema
export const deviceConsentSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
  deviceFingerprint: z.string().min(1, 'Device fingerprint is required'),
  deviceName: z.string().optional(),
  deviceType: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
});

export type DeviceConsentInput = z.infer<typeof deviceConsentSchema>;

// Get verification session schema
export const getVerificationSessionSchema = z.object({
  id: z.string().uuid('Invalid session ID'),
});

export type GetVerificationSessionInput = z.infer<typeof getVerificationSessionSchema>;

// Export all validators
export default {
  faceVerificationSchema,
  authenticatorVerificationSchema,
  enableAuthenticatorSchema,
  disableAuthenticatorSchema,
  deviceConsentSchema,
  getVerificationSessionSchema,
};
