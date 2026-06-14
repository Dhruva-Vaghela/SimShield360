import { Schema, Document, model } from 'mongoose';
import bcrypt from 'bcrypt';

// Constants
const SALT_ROUNDS = 12;
const PASSWORD_MIN_LENGTH = 8;

// Types
export interface IUser {
  email: string;
  passwordHash: string;
  role: 'customer' | 'agent';
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  simCard?: {
    iccid: string;
    msisdn: string;
    carrier: string;
  };
  authenticator?: {
    secret: string;
    isEnabled: boolean;
    backupCodes: string[];
  };
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  failedLoginAttempts: number;
  lockoutUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Custom document interface
export interface IUserDocument extends IUser, Document {
  _id: any;
  comparePassword(password: string): Promise<boolean>;
  generateAuthToken(): Promise<string>;
  lockAccount(): void;
  unlockAccount(): void;
  resetFailedAttempts(): void;
  incrementFailedAttempts(): void;
}

// User Schema
const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      required: true,
      enum: ['customer', 'agent', 'admin'],
      default: 'customer',
    },
    profile: {
      firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
      },
      lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
        match: /^[0-9+\-\s()]{10,20}$/,
      },
    },
    simCard: {
      iccid: {
        type: String,
        trim: true,
        maxlength: 20,
      },
      msisdn: {
        type: String,
        trim: true,
        maxlength: 15,
      },
      carrier: {
        type: String,
        trim: true,
        maxlength: 100,
      },
    },
    authenticator: {
      secret: {
        type: String,
        select: false,
      },
      isEnabled: {
        type: Boolean,
        default: false,
      },
      backupCodes: {
        type: [String],
        default: [],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    lockoutUntil: {
      type: Date,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
    versionKey: false,
    id: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.passwordHash;
        delete ret.authenticator?.secret;
        delete ret.authenticator?.backupCodes;
        return ret;
      },
    },
    toObject: {
      transform: (_, ret) => {
        delete ret.passwordHash;
        delete ret.authenticator?.secret;
        delete ret.authenticator?.backupCodes;
        return ret;
      },
    },
  }
);

// Pre-save hook for password hashing
userSchema.pre<IUserDocument>('save', async function (next) {
  // Only hash password if it has been modified
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method: Compare password
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, this.passwordHash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method: Lock account
userSchema.methods.lockAccount = function () {
  this.isActive = false;
  this.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
};

// Method: Unlock account
userSchema.methods.unlockAccount = function () {
  this.isActive = true;
  this.lockoutUntil = undefined;
  this.failedLoginAttempts = 0;
};

// Method: Reset failed login attempts
userSchema.methods.resetFailedAttempts = function () {
  this.failedLoginAttempts = 0;
  this.lockoutUntil = undefined;
};

// Method: Increment failed login attempts
userSchema.methods.incrementFailedAttempts = function () {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= 5) {
    this.lockAccount();
  }
};

// Method: Generate authentication token
userSchema.methods.generateAuthToken = function (): Promise<string> {
  // This method should be implemented in the JWT service
  // Keeping as placeholder for schema definition
  throw new Error('generateAuthToken must be implemented in JWT service');
};

// Compound index for email lookup
userSchema.index({ email: 1 });

// Compound index for account lockout lookup
userSchema.index({ isActive: 1, lockoutUntil: 1 });

// Compound index for role-based queries
userSchema.index({ role: 1, isActive: 1 });

// Export User model
export const User = model<IUserDocument>('User', userSchema);
