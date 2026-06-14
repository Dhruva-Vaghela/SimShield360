import { Request, Response, NextFunction } from 'express';
import { response } from '../utils/response.util';
import { FaceVerificationService } from '../services/verification/face.service';
import { AuthenticatorService } from '../services/verification/authenticator.service';
import { DeviceService } from '../services/verification/device.service';
import { AuthenticateRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger.util';

const faceService = new FaceVerificationService();
const authenticatorService = new AuthenticatorService();
const deviceService = new DeviceService();

// Submit face verification - Simulation-based
export const submitFaceVerification = async (req: AuthenticateRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { requestId, simulationResult } = req.body;

    // Validate simulation result
    if (!['match', 'no_match'].includes(simulationResult)) {
      response.validationError(res, ['Invalid simulation result. Must be "match" or "no_match"']);
      return;
    }

    const result = await faceService.verifyFace(userId, simulationResult);

    if (!result.success) {
      response.validationError(res, [result.errorMessage || 'Face verification failed']);
      return;
    }

    response.success(res, {
      success: true,
      confidence: result.confidence,
      message: 'Face verified successfully',
    });
  } catch (error) {
    logger.error('Submit face verification error:', error);
    response.internalError(res);
  }
};

// Submit authenticator code
export const submitAuthenticatorCode = async (req: AuthenticateRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { requestId, code } = req.body;

    const result = await authenticatorService.verifyTOTP(userId, code);

    if (!result.success || !result.isValid) {
      response.validationError(res, [result.errorMessage || 'Invalid authenticator code']);
      return;
    }

    response.success(res, {
      success: true,
      message: 'Authenticator code verified successfully',
    });
  } catch (error) {
    logger.error('Submit authenticator code error:', error);
    response.internalError(res);
  }
};

// Setup authenticator - Generate secret and QR code
export const setupAuthenticator = async (req: AuthenticateRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const result = await authenticatorService.generateSecret(userId);

    if (!result.success) {
      response.internalError(res, result.errorMessage);
      return;
    }

    response.success(res, {
      secret: result.secret,
      qrCodeUrl: result.qrCode,
      message: 'Scan QR code with Google Authenticator',
    });
  } catch (error) {
    logger.error('Setup authenticator error:', error);
    response.internalError(res);
  }
};

// Enable authenticator - Verify initial code and save
export const enableAuthenticator = async (req: AuthenticateRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { secret, code } = req.body;

    const result = await authenticatorService.enableAuthenticator(userId, secret, code);

    if (!result.success) {
      response.validationError(res, [result.errorMessage || 'Failed to enable authenticator']);
      return;
    }

    response.success(res, {
      success: true,
      message: 'Google Authenticator configured successfully',
    });
  } catch (error) {
    logger.error('Enable authenticator error:', error);
    response.internalError(res);
  }
};

// Disable authenticator
export const disableAuthenticator = async (req: AuthenticateRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { code } = req.body;

    const result = await authenticatorService.disableAuthenticator(userId, code);

    if (!result.success) {
      response.validationError(res, [result.errorMessage || 'Failed to disable authenticator']);
      return;
    }

    response.success(res, {
      success: true,
      message: 'Google Authenticator disabled successfully',
    });
  } catch (error) {
    logger.error('Disable authenticator error:', error);
    response.internalError(res);
  }
};

// Get authenticator status
export const getAuthenticatorStatus = async (req: AuthenticateRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get user to check authenticator status
    const User = require('../../models/User.model').User;
    const user = await User.findById(userId).select('authenticator').exec();

    if (!user) {
      response.notFound(res, 'User not found');
      return;
    }

    const isConfigured = user.authenticator?.isEnabled || false;

    response.success(res, {
      isConfigured,
      status: isConfigured ? 'Configured' : 'Not Configured',
    });
  } catch (error) {
    logger.error('Get authenticator status error:', error);
    response.internalError(res);
  }
};

// Grant device consent
export const grantDeviceConsent = async (req: AuthenticateRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { requestId, deviceFingerprint, deviceName, deviceType, browser, os } = req.body;

    // Register device using correct DeviceService API
    const registerResult = await deviceService.registerDevice({
      userId,
      fingerprint: deviceFingerprint,
      deviceName: deviceName || 'Unknown Device',
      deviceType: deviceType || 'mobile',
      browser,
      os,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    if (!registerResult.success) {
      response.internalError(res);
      return;
    }

    // Grant trust to the device
    if (registerResult.deviceId) {
      await deviceService.grantDeviceTrust(registerResult.deviceId, userId);
    }

    response.success(res, {
      success: true,
      message: 'Device consent granted successfully',
    });
  } catch (error) {
    logger.error('Grant device consent error:', error);
    response.internalError(res);
  }
};

// Get verification session status
export const getVerificationSessionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Get session status (implementation depends on verification session model)

    response.success(res, {
      id,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    logger.error('Get verification session status error:', error);
    response.internalError(res);
  }
};

// Export all controller functions
export default {
  submitFaceVerification,
  submitAuthenticatorCode,
  setupAuthenticator,
  enableAuthenticator,
  disableAuthenticator,
  getAuthenticatorStatus,
  grantDeviceConsent,
  getVerificationSessionStatus,
};
