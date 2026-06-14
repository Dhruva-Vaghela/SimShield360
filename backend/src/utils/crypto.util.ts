import crypto from 'crypto';
import environment from '../config/environment.config';

// Constants
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

// Password hashing
export class PasswordHasher {
  static readonly SALT_ROUNDS = 12;

  // Hash password using bcrypt
  static async hashPassword(password: string): Promise<string> {
    try {
      const bcrypt = await import('bcrypt');
      return await bcrypt.hash(password, this.SALT_ROUNDS);
    } catch (error) {
      throw new Error('Failed to hash password');
    }
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const bcrypt = await import('bcrypt');
      return await bcrypt.compare(password, hash);
    } catch (error) {
      return false;
    }
  }

  // Check password strength
  static validatePasswordStrength(password: string): {
    valid: boolean;
    score: number;
    errors: string[];
  } {
    const errors: string[] = [];
    let score = 0;
    const MIN_LENGTH = 8;

    // Length check
    if (password.length < MIN_LENGTH) {
      errors.push(`Password must be at least ${MIN_LENGTH} characters`);
    } else {
      score += 1;
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    // Digit check
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one digit');
    } else {
      score += 1;
    }

    // Symbol check (optional)
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    return {
      valid: errors.length === 0,
      score,
      errors,
    };
  }
}

// AES encryption/decryption for sensitive data
export class AESCipher {
  // Generate encryption key
  static generateKey(): Buffer {
    return crypto.randomBytes(KEY_LENGTH);
  }

  // Encrypt data
  static encrypt(data: string, key: Buffer): { encryptedData: string; iv: string; authTag: string } {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
      };
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  // Decrypt data
  static decrypt(encryptedData: string, key: Buffer, iv: string, authTag: string): string {
    try {
      const ivBuffer = Buffer.from(iv, 'hex');
      const authTagBuffer = Buffer.from(authTag, 'hex');
      const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, ivBuffer);

      decipher.setAuthTag(authTagBuffer);

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  // Encrypt face encoding data
  static encryptFaceEncoding(encodingData: string, key: Buffer): { encryptedData: string; iv: string; authTag: string } {
    return this.encrypt(encodingData, key);
  }

  // Decrypt face encoding data
  static decryptFaceEncoding(encryptedData: string, key: Buffer, iv: string, authTag: string): string {
    return this.decrypt(encryptedData, key, iv, authTag);
  }
}

// Token generation
export class TokenGenerator {
  // Generate random token
  static generateRandomToken(length: number = 32): string {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }

  // Generate secure password reset token
  static generatePasswordResetToken(length: number = 64): string {
    return this.generateRandomToken(length);
  }

  // Generate TOTP secret
  static generateTOTPSecret(): string {
    // base32 encode manually since Node's Buffer doesn't support it natively
    const bytes = crypto.randomBytes(20);
    return bytes.toString('hex'); // hex is fine for TOTP secrets; speakeasy handles encoding
  }

  // Generate backup codes
  static generateBackupCodes(count: number = 10, length: number = 12): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(this.generateRandomToken(length));
    }
    return codes;
  }
}

// Hashing utilities
export class HashUtils {
  // SHA-256 hash
  static sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // MD5 hash (for non-security purposes)
  static md5(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  // UUID v4 generator
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  // Base64 encode
  static base64Encode(data: string): string {
    return Buffer.from(data).toString('base64');
  }

  // Base64 decode
  static base64Decode(data: string): string {
    return Buffer.from(data, 'base64').toString('ascii');
  }
}

// Device fingerprinting
export class DeviceFingerprint {
  // Generate device fingerprint from user agent and IP
  static generateFingerprint(userAgent: string, ip: string): string {
    const data = `${userAgent}-${ip}-${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Generate secure device ID
  static generateDeviceID(): string {
    return `dev_${crypto.randomBytes(16).toString('hex')}`;
  }
}

// Export all classes
export default {
  PasswordHasher,
  AESCipher,
  TokenGenerator,
  HashUtils,
  DeviceFingerprint,
};
