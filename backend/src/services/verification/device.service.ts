import crypto from 'crypto';
import { TrustedDevice } from '../../models/TrustedDevice.model';
import logger from '../../utils/logger.util';

export interface RegisterDeviceData {
  userId: string;
  fingerprint: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'other';
  browser?: string;
  os?: string;
  ipAddress: string;
  userAgent: string;
}

export interface DeviceServiceResult {
  success: boolean;
  device?: any;
  devices?: any[];
  deviceId?: string;
  fingerprint?: string;
  errorMessage?: string;
}

export class DeviceService {
  /**
   * Get all devices for a user
   */
  async getUserDevices(userId: string): Promise<DeviceServiceResult> {
    try {
      const devices = await TrustedDevice.find({ userId })
        .sort({ lastUsedAt: -1 })
        .lean();

      return {
        success: true,
        devices,
      };
    } catch (error) {
      logger.error('Get user devices error:', error);
      return {
        success: false,
        errorMessage: 'Failed to retrieve devices',
      };
    }
  }

  /**
   * Get device by ID
   */
  async getDeviceById(deviceId: string, userId: string): Promise<DeviceServiceResult> {
    try {
      const device = await TrustedDevice.findOne({
        _id: deviceId,
        userId,
      }).lean();

      if (!device) {
        return {
          success: false,
          errorMessage: 'Device not found',
        };
      }

      return {
        success: true,
        device,
      };
    } catch (error) {
      logger.error('Get device by ID error:', error);
      return {
        success: false,
        errorMessage: 'Failed to retrieve device',
      };
    }
  }

  /**
   * Register a new trusted device
   */
  async registerDevice(data: RegisterDeviceData): Promise<DeviceServiceResult> {
    try {
      // Check if device already exists
      const existingDevice = await TrustedDevice.findOne({
        userId: data.userId,
        fingerprint: data.fingerprint,
      });

      if (existingDevice) {
        // Update last used
        existingDevice.lastUsedAt = new Date();
        await existingDevice.save();

        return {
          success: true,
          deviceId: existingDevice._id.toString(),
          device: existingDevice.toObject(),
        };
      }

      // Create new device
      const device = new TrustedDevice({
        userId: data.userId,
        fingerprint: data.fingerprint,
        deviceName: data.deviceName,
        deviceType: data.deviceType,
        browser: data.browser,
        os: data.os,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        isTrusted: false,
        trustStatus: 'pending',
        lastUsedAt: new Date(),
      });

      await device.save();

      logger.info('Device registered', {
        deviceId: device._id,
        userId: data.userId,
        deviceName: data.deviceName,
      });

      return {
        success: true,
        deviceId: device._id.toString(),
        device: device.toObject(),
      };
    } catch (error) {
      logger.error('Register device error:', error);
      return {
        success: false,
        errorMessage: 'Failed to register device',
      };
    }
  }

  /**
   * Update device details
   */
  async updateDevice(
    deviceId: string,
    userId: string,
    updates: { deviceName?: string }
  ): Promise<DeviceServiceResult> {
    try {
      const device = await TrustedDevice.findOne({
        _id: deviceId,
        userId,
      });

      if (!device) {
        return {
          success: false,
          errorMessage: 'Device not found',
        };
      }

      if (updates.deviceName) {
        device.deviceName = updates.deviceName;
      }

      await device.save();

      logger.info('Device updated', {
        deviceId: device._id,
        userId,
      });

      return {
        success: true,
        device: device.toObject(),
      };
    } catch (error) {
      logger.error('Update device error:', error);
      return {
        success: false,
        errorMessage: 'Failed to update device',
      };
    }
  }

  /**
   * Remove trusted device
   */
  async removeDevice(deviceId: string, userId: string): Promise<DeviceServiceResult> {
    try {
      const device = await TrustedDevice.findOneAndDelete({
        _id: deviceId,
        userId,
      });

      if (!device) {
        return {
          success: false,
          errorMessage: 'Device not found',
        };
      }

      logger.info('Device removed', {
        deviceId,
        userId,
      });

      return {
        success: true,
      };
    } catch (error) {
      logger.error('Remove device error:', error);
      return {
        success: false,
        errorMessage: 'Failed to remove device',
      };
    }
  }

  /**
   * Revoke device trust status
   */
  async revokeDeviceTrust(deviceId: string, userId: string): Promise<DeviceServiceResult> {
    try {
      const device = await TrustedDevice.findOne({
        _id: deviceId,
        userId,
      });

      if (!device) {
        return {
          success: false,
          errorMessage: 'Device not found',
        };
      }

      device.isTrusted = false;
      device.trustStatus = 'revoked';
      device.revokedAt = new Date();

      await device.save();

      logger.info('Device trust revoked', {
        deviceId: device._id,
        userId,
      });

      return {
        success: true,
        device: device.toObject(),
      };
    } catch (error) {
      logger.error('Revoke device trust error:', error);
      return {
        success: false,
        errorMessage: 'Failed to revoke device trust',
      };
    }
  }

  /**
   * Grant device trust
   */
  async grantDeviceTrust(deviceId: string, userId: string): Promise<DeviceServiceResult> {
    try {
      const device = await TrustedDevice.findOne({
        _id: deviceId,
        userId,
      });

      if (!device) {
        return {
          success: false,
          errorMessage: 'Device not found',
        };
      }

      device.isTrusted = true;
      device.trustStatus = 'trusted';
      device.trustedAt = new Date();

      await device.save();

      logger.info('Device trust granted', {
        deviceId: device._id,
        userId,
      });

      return {
        success: true,
        device: device.toObject(),
      };
    } catch (error) {
      logger.error('Grant device trust error:', error);
      return {
        success: false,
        errorMessage: 'Failed to grant device trust',
      };
    }
  }

  /**
   * Check if device is trusted
   */
  async isDeviceTrusted(userId: string, fingerprint: string): Promise<boolean> {
    try {
      const device = await TrustedDevice.findOne({
        userId,
        fingerprint,
        isTrusted: true,
      });

      return !!device;
    } catch (error) {
      logger.error('Check device trusted error:', error);
      return false;
    }
  }

  /**
   * Generate device fingerprint
   */
  generateFingerprint(ipAddress: string, userAgent: string): string {
    const data = `${ipAddress}:${userAgent}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Update device last used timestamp
   */
  async updateLastUsed(deviceId: string): Promise<void> {
    try {
      await TrustedDevice.findByIdAndUpdate(deviceId, {
        lastUsedAt: new Date(),
      });
    } catch (error) {
      logger.error('Update device last used error:', error);
    }
  }
}

export default DeviceService;
