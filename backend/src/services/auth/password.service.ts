import bcrypt from 'bcrypt';
import { CONSTANTS } from '../../config/constants';
import { ValidationError } from '../../middleware/error.middleware';

// Constants
const SALT_ROUNDS = 12;

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    throw new Error('Failed to hash password');
  }
};

// Verify password
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    return false;
  }
};

// Validate password strength
export const validatePasswordStrength = (password: string): {
  valid: boolean;
  score: number;
  errors: string[];
} => {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < CONSTANTS.PASSWORD.MIN_LENGTH) {
    errors.push(`Password must be at least ${CONSTANTS.PASSWORD.MIN_LENGTH} characters`);
  } else {
    score += 1;
  }

  // Uppercase check
  if (CONSTANTS.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  // Lowercase check
  if (CONSTANTS.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  // Digit check
  if (CONSTANTS.PASSWORD.REQUIRE_DIGITS && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit');
  } else {
    score += 1;
  }

  // Symbol check (optional)
  if (CONSTANTS.PASSWORD.REQUIRE_SYMBOLS && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/\?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  return {
    valid: errors.length === 0,
    score,
    errors,
  };
};

// Validate password and throw error if invalid
export const validatePassword = async (password: string): Promise<void> => {
  const strength = validatePasswordStrength(password);

  if (!strength.valid) {
    throw new ValidationError(strength.errors.join(', '));
  }

  // Check if password is in common password list (optional)
  // const isCommon = await isCommonPassword(password);
  // if (isCommon) {
  //   throw new ValidationError('Password is too common. Please choose a stronger password.');
  // }
};

// Generate secure token
export const generateSecureToken = (length: number = 32): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

// Export all functions
export default {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  validatePassword,
  generateSecureToken,
};
