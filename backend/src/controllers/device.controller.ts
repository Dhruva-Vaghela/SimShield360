import { Response, NextFunction } from 'express';
import { AuthenticateRequest } from '../middleware/auth.middleware';
import { response } from '../utils/response.util';
import { DeviceService } from '../services/verification/device.service';
import { AuditService } from '../services/audit/audit.service';
import logger from '../utils/logger.util';

const deviceService = new DeviceService();
const auditService = new AuditService();

/**
 * Get all trusted devices for authenticated user
 */
export const getTrustedDevices = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const result = await deviceService.getUserDevices(userId);

    if (!result.success) {
      response.internalError(res, result.errorMessage);
      return;
    }

    response.success(res, result.devices);
  } catch (error) {
    logger.error('Get trusted devices error:', error);
    response.internalError(res);
  }
};

/**
 * Get device by ID
 */
export const getDeviceById = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await deviceService.getDeviceById(id, userId);

    if (!result.success) {
      response.notFound(res, 'Device', id);
      return;
    }

    response.success(res, result.device);
  } catch (error) {
    logger.error('Get device by ID error:', error);
    response.internalError(res);
  }
};

/**
 * Register a new trusted device
 */
export const registerDevice = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { fingerprint, deviceName, deviceType, browser, os } = req.body;

    const result = await deviceService.registerDevice({
      userId,
      fingerprint,
      deviceName,
      deviceType,
      browser,
      os,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    if (!result.success) {
      response.internalError(res, result.errorMessage);
      return;
    }

    // Create audit log
    await auditService.createAuditLog({
      userId,
      action: 'device_registered',
      resource: 'device',
      resourceId: result.deviceId!,
      method: 'POST',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      details: { deviceName, deviceType },
    });

    response.created(res, {
      deviceId: result.deviceId,
      message: 'Device registered successfully',
    });
  } catch (error) {
    logger.error('Register device error:', error);
    response.internalError(res);
  }
};

/**
 * Update device details
 */
export const updateDevice = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { deviceName } = req.body;

    const result = await deviceService.updateDevice(id, userId, { deviceName });

    if (!result.success) {
      response.internalError(res, result.errorMessage);
      return;
    }

    // Create audit log
    await auditService.createAuditLog({
      userId,
      action: 'device_updated',
      resource: 'device',
      resourceId: id,
      method: 'PUT',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      details: { deviceName },
    });

    response.success(res, {
      message: 'Device updated successfully',
      device: result.device,
    });
  } catch (error) {
    logger.error('Update device error:', error);
    response.internalError(res);
  }
};

/**
 * Remove trusted device
 */
export const removeDevice = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await deviceService.removeDevice(id, userId);

    if (!result.success) {
      response.internalError(res, result.errorMessage);
      return;
    }

    // Create audit log
    await auditService.createAuditLog({
      userId,
      action: 'device_removed',
      resource: 'device',
      resourceId: id,
      method: 'DELETE',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    response.success(res, {
      message: 'Device removed successfully',
    });
  } catch (error) {
    logger.error('Remove device error:', error);
    response.internalError(res);
  }
};

/**
 * Revoke device trust status
 */
export const revokeDeviceTrust = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await deviceService.revokeDeviceTrust(id, userId);

    if (!result.success) {
      response.internalError(res, result.errorMessage);
      return;
    }

    // Create audit log
    await auditService.createAuditLog({
      userId,
      action: 'device_trust_revoked',
      resource: 'device',
      resourceId: id,
      method: 'POST',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    response.success(res, {
      message: 'Device trust revoked successfully',
      device: result.device,
    });
  } catch (error) {
    logger.error('Revoke device trust error:', error);
    response.internalError(res);
  }
};

/**
 * Get current device fingerprint
 */
export const getCurrentDeviceFingerprint = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const fingerprint = deviceService.generateFingerprint(
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    response.success(res, {
      fingerprint,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (error) {
    logger.error('Get current device fingerprint error:', error);
    response.internalError(res);
  }
};

export default {
  getTrustedDevices,
  getDeviceById,
  registerDevice,
  updateDevice,
  removeDevice,
  revokeDeviceTrust,
  getCurrentDeviceFingerprint,
};
