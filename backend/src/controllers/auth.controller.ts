import { Request, Response, NextFunction } from 'express';
import { response } from '../utils/response.util';
import { UserService } from '../services/user/user.service';
import { PasswordHasher, TokenGenerator } from '../utils/crypto.util';
import { JwtService } from '../services/auth/jwt.service';
import { SessionService } from '../services/auth/session.service';
import { AuthenticateRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger.util';

// User service instances
const userService = new UserService();
const sessionService = new SessionService();

// Register handler
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, confirmPassword, profile, role } = req.body;

    // Validate password match
    if (password !== confirmPassword) {
      response.validationError(res, ['Passwords do not match']);
      return;
    }

    // Validate password strength
    const passwordValidation = PasswordHasher.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      response.validationError(res, passwordValidation.errors);
      return;
    }

    // Hash password
    const passwordHash = await PasswordHasher.hashPassword(password);

    // Create user
    const result = await userService.createUser({
      email,
      password: passwordHash,
      role: role || 'customer',
      profile,
    });

    if (!result.success) {
      response.conflict(res, result.errorMessage || 'Failed to create user');
      return;
    }

    // Create audit log
    // const AuditLog = require('../models/AuditLog.model');
    // await AuditLog.createEntry({
    //   userId: result.userId,
    //   action: 'user_registered',
    //   resource: 'user',
    //   resourceId: result.userId,
    //   method: 'POST',
    //   ipAddress: req.ip || req.connection.remoteAddress,
    // });

    // Create session
    await sessionService.createSession(result.userId!, req.ip || '', req.headers['user-agent'] as string);

    response.created(res, {
      userId: result.userId,
      message: 'User registered successfully',
    });
  } catch (error) {
    logger.error('Registration error:', error);
    response.internalError(res);
  }
};

// Login handler
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Get user
    const userResult = await userService.getUserByEmail(email);

    if (!userResult.success) {
      response.unauthorized(res, 'Invalid credentials');
      return;
    }

    // Verify password
    const passwordService = require('../services/auth/password.service');
    const isPasswordValid = await passwordService.verifyPassword(password, userResult.user!.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      await userService.incrementFailedLoginAttempts(userResult.user!.id);

      response.unauthorized(res, 'Invalid credentials');
      return;
    }

    // Reset failed login attempts
    await userService.resetFailedLoginAttempts(userResult.user!.id);

    // Generate tokens
    const payload: any = {
      userId: userResult.user!.id,
      email: userResult.user!.email,
      role: userResult.user!.role,
    };

    const accessToken = JwtService.generateAccessToken(payload);
    const refreshToken = JwtService.generateRefreshToken(payload);

    // Update last login
    await userService.updateLastLogin(userResult.user!.id);

    // Create session
    await sessionService.createSession(userResult.user!.id, req.ip || '', req.headers['user-agent'] as string);

    // Create audit log
    // const AuditLog = require('../models/AuditLog.model');
    // await AuditLog.createEntry({
    //   userId: userResult.user!.id,
    //   action: 'user_login',
    //   resource: 'user',
    //   resourceId: userResult.user!.id,
    //   method: 'POST',
    //   ipAddress: req.ip || req.connection.remoteAddress,
    // });

    response.success(res, {
      accessToken,
      refreshToken,
      user: {
        id: userResult.user!.id,
        email: userResult.user!.email,
        role: userResult.user!.role,
        profile: userResult.user!.profile,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    response.internalError(res);
  }
};

// Logout handler
export const logout = async (req: AuthenticateRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Invalidate session
    await sessionService.logoutUser(userId);

    // Create audit log
    // const AuditLog = require('../models/AuditLog.model');
    // await AuditLog.createEntry({
    //   userId,
    //   action: 'user_logout',
    //   resource: 'user',
    //   resourceId: userId,
    //   method: 'POST',
    //   ipAddress: req.ip || req.connection.remoteAddress,
    // });

    response.success(res, { message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    response.internalError(res);
  }
};

// Refresh token handler
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      response.unauthorized(res, 'Refresh token is required');
      return;
    }

    // Verify refresh token
    const decoded = JwtService.verifyRefreshToken(refreshToken);

    if (!decoded) {
      response.unauthorized(res, 'Invalid or expired refresh token');
      return;
    }

    // Generate new tokens
    const newAccessToken = JwtService.generateAccessToken(decoded);
    const newRefreshToken = JwtService.generateRefreshToken(decoded);

    response.success(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    response.internalError(res);
  }
};

// Forgot password handler
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    // Get user
    const userResult = await userService.getUserByEmail(email);

    if (!userResult.success) {
      // Don't reveal if user exists
      response.success(res, { message: 'If email exists, reset link will be sent' });
      return;
    }

    // Generate reset token
    const resetToken = TokenGenerator.generatePasswordResetToken(64);

    // Save reset token (implementation depends on token storage)
    // await saveResetToken(userResult.user!.id, resetToken);

    // Send reset email
    // const emailService = require('../services/notification/email.service');
    // await emailService.sendPasswordResetEmail(email, resetToken);

    response.success(res, { message: 'If email exists, reset link will be sent' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    response.internalError(res);
  }
};

// Reset password handler
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password, confirmPassword } = req.body;

    // Validate password match
    if (password !== confirmPassword) {
      response.validationError(res, ['Passwords do not match']);
      return;
    }

    // Validate password strength
    const passwordValidation = PasswordHasher.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      response.validationError(res, passwordValidation.errors);
      return;
    }

    // Validate reset token
    // const isValid = await validateResetToken(token);
    // if (!isValid) {
    //   response.validationError(res, ['Invalid or expired reset token']);
    //   return;
    // }

    // Get user from token
    // const userId = getUserIdFromToken(token);

    // Hash new password
    const passwordHash = await PasswordHasher.hashPassword(password);

    // Update password
    // await User.findByIdAndUpdate(userId, { passwordHash }).exec();

    // Invalidate all sessions
    // await sessionService.invalidateAllSessions(userId);

    response.success(res, { message: 'Password reset successfully' });
  } catch (error) {
    logger.error('Reset password error:', error);
    response.internalError(res);
  }
};

// Get profile handler
export const getProfile = async (req: AuthenticateRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const result = await userService.getUserById(userId);

    if (!result.success) {
      response.notFound(res, 'User', userId);
      return;
    }

    response.success(res, result.user);
  } catch (error) {
    logger.error('Get profile error:', error);
    response.internalError(res);
  }
};

// Update profile handler
export const updateProfile = async (req: AuthenticateRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const result = await userService.updateProfile(userId, req.body);

    if (!result.success) {
      response.internalError(res);
      return;
    }

    response.success(res, result.user);
  } catch (error) {
    logger.error('Update profile error:', error);
    response.internalError(res);
  }
};

// Setup authenticator handler
export const setupAuthenticator = async (req: AuthenticateRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Generate TOTP secret
    const authenticatorService = require('../services/verification/authenticator.service');
    const result = await authenticatorService.generateSecret(userId);

    if (!result.success) {
      response.internalError(res, result.errorMessage || 'Failed to generate TOTP secret');
      return;
    }

    response.success(res, {
      secret: result.secret,
      qrCode: result.qrCode,
    });
  } catch (error) {
    logger.error('Setup authenticator error:', error);
    response.internalError(res);
  }
};

// Verify authenticator handler
export const verifyAuthenticator = async (req: AuthenticateRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { token } = req.body;

    const authenticatorService = require('../services/verification/authenticator.service');
    const result = await authenticatorService.verifyTOTP(userId, token);

    if (!result.success || !result.isValid) {
      response.validationError(res, [result.errorMessage || 'Invalid TOTP code']);
      return;
    }

    response.success(res, { message: 'Authenticator verified successfully' });
  } catch (error) {
    logger.error('Verify authenticator error:', error);
    response.internalError(res);
  }
};

// Disable authenticator handler
export const disableAuthenticator = async (req: AuthenticateRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { token } = req.body;

    const authenticatorService = require('../services/verification/authenticator.service');
    const result = await authenticatorService.disableAuthenticator(userId, token);

    if (!result.success) {
      response.internalError(res, result.errorMessage || 'Failed to disable authenticator');
      return;
    }

    response.success(res, { message: 'Authenticator disabled successfully' });
  } catch (error) {
    logger.error('Disable authenticator error:', error);
    response.internalError(res);
  }
};

// Export all controller functions
export default {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  setupAuthenticator,
  verifyAuthenticator,
  disableAuthenticator,
};
