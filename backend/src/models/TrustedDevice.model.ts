import { Schema, Document, model, Types } from 'mongoose';

// Types
export interface ITrustedDevice {
  userId: Types.ObjectId;
  deviceFingerprint: string;
  fingerprint?: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  ipAddress?: string;
  userAgent?: string;
  isTrusted: boolean;
  trustStatus?: 'pending' | 'trusted' | 'revoked';
  lastUsedAt: Date;
  trustGrantedAt?: Date;
  trustedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Custom document interface
export interface ITrustedDeviceDocument extends ITrustedDevice, Document { _id: any; }

// TrustedDevice Schema
const trustedDeviceSchema = new Schema<ITrustedDeviceDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deviceFingerprint: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    deviceName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    deviceType: {
      type: String,
      required: true,
      enum: ['mobile', 'tablet', 'desktop'],
    },
    browser: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    os: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    isTrusted: {
      type: Boolean,
      required: true,
      default: false,
    },
    lastUsedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    trustGrantedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
    versionKey: false,
    id: true,
  }
);

// Compound unique index: One device per user fingerprint
trustedDeviceSchema.index({ userId: 1, deviceFingerprint: 1 }, { unique: true });

// Index for trusted devices
trustedDeviceSchema.index({ isTrusted: 1 });

// Index for user's devices
trustedDeviceSchema.index({ userId: 1, lastUsedAt: -1 });

// Index for device type
trustedDeviceSchema.index({ deviceType: 1 });

// Static: Get trusted device by fingerprint
trustedDeviceSchema.statics.getDeviceByFingerprint = async function (
  userId: string,
  deviceFingerprint: string
): Promise<ITrustedDeviceDocument | null> {
  return this.findOne({ userId, deviceFingerprint }).exec();
};

// Static: Get all devices for user
trustedDeviceSchema.statics.getUserDevices = async function (userId: string, trustedOnly = false) {
  const query: Record<string, unknown> = { userId };
  if (trustedOnly) {
    query.isTrusted = true;
  }
  return this.find(query).sort({ lastUsedAt: -1 }).exec();
};

// Static: Check if device is trusted
trustedDeviceSchema.statics.isDeviceTrusted = async function (
  userId: string,
  deviceFingerprint: string
): Promise<boolean> {
  const device = await this.findOne({ userId, deviceFingerprint, isTrusted: true }).exec();
  return !!device;
};

// Static: Trust a device
trustedDeviceSchema.statics.trustDevice = async function (
  userId: string,
  deviceFingerprint: string,
  deviceData: {
    deviceName: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    browser?: string;
    os?: string;
  }
): Promise<ITrustedDeviceDocument> {
  const device = await this.findOneAndUpdate(
    { userId, deviceFingerprint },
    {
      $set: {
        ...deviceData,
        isTrusted: true,
        trustGrantedAt: new Date(),
        lastUsedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean(false);

  if (!device) {
    throw new Error('Failed to trust device');
  }

  return device;
};

// Static: Remove device trust
trustedDeviceSchema.statics.removeDeviceTrust = async function (
  userId: string,
  deviceFingerprint: string
): Promise<void> {
  await this.findOneAndDelete({ userId, deviceFingerprint }).exec();
};

// Method: Update last used timestamp
trustedDeviceSchema.methods.updateLastUsed = async function () {
  this.lastUsedAt = new Date();
  await this.save();
};

// Method: Untrust device
trustedDeviceSchema.methods.untrust = async function () {
  this.isTrusted = false;
  this.trustGrantedAt = undefined;
  await this.save();
};

// Export TrustedDevice model
export const TrustedDevice = model<ITrustedDeviceDocument>('TrustedDevice', trustedDeviceSchema);
