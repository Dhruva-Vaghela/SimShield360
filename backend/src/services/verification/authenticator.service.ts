import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { User } from '../../models/User.model';
import { AuditLog } from '../../models/AuditLog.model';
import logger from '../../utils/logger.util';

// Authenticator verification service
export class AuthenticatorService {
  // Generate TOTP secret for user
  async generateSecret(userId: string): Promise<{
    success: boolean;
    secret?: string;
    qrCode?: string;
    errorMessage?: string;
  }> {
    try {
      // Get user
      const user = await User.findById(userId).select('_id email phoneNumber').exec();

      if (!user) {
        return {
          success: false,
          errorMessage: 'User not found',
        };
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `SIMShield 360 (${user.email || "user"})`,
        issuer: 'SIMShield 360',
        length: 32,
      });

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url || '');

      // Create audit log
      await AuditLog.create({
        userId,
        action: 'authenticator_secret_generated',
        resource: 'user',
        resourceId: userId,
        method: 'POST',
        ipAddress: 'unknown',
      });

      logger.info('TOTP secret generated', {
        userId,
      });

      return {
        success: true,
        secret: secret.base32,
        qrCode: qrCodeDataUrl,
      };
    } catch (error) {
      logger.error('TOTP secret generation error:', error);
      return {
        success: false,
        errorMessage: 'Failed to generate TOTP secret',
      };
    }
  }

  // Verify TOTP code
  async verifyTOTP(userId: string, token: string): Promise<{
    success: boolean;
    isValid: boolean;
    errorMessage?: string;
  }> {
    try {
      // Get user with authenticator secret
      const user = await User.findById(userId).select('+authenticator').exec();

      if (!user) {
        return {
          success: false,
          isValid: false,
          errorMessage: 'User not found',
        };
      }

      if (!user.authenticator?.secret) {
        return {
          success: false,
          isValid: false,
          errorMessage: 'Authenticator not configured',
        };
      }

      // Verify TOTP token
      const verification = speakeasy.totp.verify({
        secret: user.authenticator.secret,
        token,
        encoding: 'base32',
        window: 1, // Allow 1 step tolerance (30 seconds before/after)
      });

      // Create audit log
      await AuditLog.create({
        userId,
        action: verification ? 'authenticator_verified' : 'authenticator_verification_failed',
        resource: 'user',
        resourceId: userId,
        method: 'POST',
        ipAddress: 'unknown',
        metadata: {
          success: verification,
        },
      });

      return {
        success: true,
        isValid: verification,
        errorMessage: verification ? undefined : 'Invalid TOTP code',
      };
    } catch (error) {
      logger.error('TOTP verification error:', error);
      return {
        success: false,
        isValid: false,
        errorMessage: 'TOTP verification failed',
      };
    }
  }

  // Enable authenticator for user
  async enableAuthenticator(
    userId: string,
    secret: string,
    token: string
  ): Promise<{
    success: boolean;
    backupCodes?: string[];
    errorMessage?: string;
  }> {
    try {
      // Verify token with the provided secret first
      const verification = speakeasy.totp.verify({
        secret,
        token,
        encoding: 'base32',
        window: 1,
      });

      if (!verification) {
        return {
          success: false,
          errorMessage: 'Invalid TOTP code. Please try again.',
        };
      }

      // Get user
      const user = await User.findById(userId).exec();

      if (!user) {
        return {
          success: false,
          errorMessage: 'User not found',
        };
      }

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Update user authenticator
      user.authenticator = {
        secret,
        isEnabled: true,
        backupCodes,
      };

      await user.save();

      // Create audit log
      await AuditLog.create({
        userId,
        action: 'authenticator_enabled',
        resource: 'user',
        resourceId: userId,
        method: 'POST',
        ipAddress: 'unknown',
      });

      logger.info('Authenticator enabled', {
        userId,
      });

      return {
        success: true,
        backupCodes,
      };
    } catch (error) {
      logger.error('Authenticator enable error:', error);
      return {
        success: false,
        errorMessage: 'Failed to enable authenticator',
      };
    }
  }

  // Disable authenticator for user
  async disableAuthenticator(userId: string, token: string): Promise<{
    success: boolean;
    errorMessage?: string;
  }> {
    try {
      // Verify token for security
      const verifyResult = await this.verifyTOTP(userId, token);

      if (!verifyResult.isValid) {
        return {
          success: false,
          errorMessage: 'Invalid TOTP code',
        };
      }

      // Get user
      const user = await User.findById(userId).exec();

      if (!user) {
        return {
          success: false,
          errorMessage: 'User not found',
        };
      }

      // Disable authenticator
      user.authenticator = {
        secret: '',
        isEnabled: false,
        backupCodes: [],
      };

      await user.save();

      // Create audit log
      await AuditLog.create({
        userId,
        action: 'authenticator_disabled',
        resource: 'user',
        resourceId: userId,
        method: 'POST',
        ipAddress: 'unknown',
      });

      logger.info('Authenticator disabled', {
        userId,
      });

      return {
        success: true,
      };
    } catch (error) {
      logger.error('Authenticator disable error:', error);
      return {
        success: false,
        errorMessage: 'Failed to disable authenticator',
      };
    }
  }

  // Generate backup codes
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = this.generateSecureCode();
      codes.push(code);
    }
    return codes;
  }

  // Generate secure code
  private generateSecureCode(length: number = 12): string {
    const crypto = require('crypto');
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }

  // Verify backup code
  async verifyBackupCode(userId: string, code: string): Promise<{
    success: boolean;
    isValid: boolean;
  }> {
    try {
      const user = await User.findById(userId).select('+authenticator').exec();

      if (!user || !user.authenticator?.isEnabled) {
        return {
          success: false,
          isValid: false,
        };
      }

      const isValid = user.authenticator.backupCodes.includes(code);

      return {
        success: true,
        isValid,
      };
    } catch (error) {
      logger.error('Backup code verification error:', error);
      return {
        success: false,
        isValid: false,
      };
    }
  }
}

// Export service
export default AuthenticatorService;
