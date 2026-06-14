import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { authRateLimiter } from '../middleware/rateLimit.middleware';
import authController from '../controllers/auth.controller';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyAuthenticatorSchema,
} from '../validators/auth.validator';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and get JWT tokens
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  authController.login
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (invalidate session)
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  authController.refreshToken
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset link to email
 * @access  Public
 */
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getProfile
);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  authController.updateProfile
);

/**
 * @route   POST /api/v1/auth/authenticator/setup
 * @desc    Setup TOTP authenticator (get QR code)
 * @access  Private
 */
router.post(
  '/authenticator/setup',
  authenticate,
  authController.setupAuthenticator
);

/**
 * @route   POST /api/v1/auth/authenticator/verify
 * @desc    Verify and enable TOTP authenticator
 * @access  Private
 */
router.post(
  '/authenticator/verify',
  authenticate,
  validate(verifyAuthenticatorSchema),
  authController.verifyAuthenticator
);

/**
 * @route   POST /api/v1/auth/authenticator/disable
 * @desc    Disable TOTP authenticator
 * @access  Private
 */
router.post(
  '/authenticator/disable',
  authenticate,
  validate(verifyAuthenticatorSchema),
  authController.disableAuthenticator
);

export default router;
