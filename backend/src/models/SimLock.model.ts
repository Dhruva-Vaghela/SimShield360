import { Schema, Document, model, Types } from 'mongoose';

// Types
export interface ISimLock {

  userId: Types.ObjectId;
  iccid: string;
  isLocked: boolean;
  lockType: 'user_initiated' | 'system_initiated';
  lockReason?: string;
  lockedAt?: Date;
  unlockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Custom document interface
export interface ISimLockDocument extends ISimLock, Document { _id: any; }

// SimLock Schema
const simLockSchema = new Schema<ISimLockDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    iccid: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
      index: true,
    },
    isLocked: {
      type: Boolean,
      required: true,
      default: false,
    },
    lockType: {
      type: String,
      required: true,
      enum: ['user_initiated', 'system_initiated'],
      default: 'user_initiated',
    },
    lockReason: {
      type: String,
      maxlength: 500,
    },
    lockedAt: {
      type: Date,
    },
    unlockedAt: {
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
  }
);

// Compound unique index: One active SIM lock per user
simLockSchema.index({ userId: 1, isLocked: 1 }, { unique: true, partialFilterExpression: { isLocked: true } });

// Index for ICCID lookup
simLockSchema.index({ iccid: 1 });

// Index for locked SIMs
simLockSchema.index({ isLocked: 1 });

// Index for user's SIM locks
simLockSchema.index({ userId: 1, lockedAt: -1 });

// Method: Enable SIM lock
simLockSchema.methods.enableLock = async function (reason?: string) {
  this.isLocked = true;
  this.lockedAt = new Date();
  this.lockReason = reason;
  this.unlockedAt = undefined;
  await this.save();
};

// Method: Disable SIM lock
simLockSchema.methods.disableLock = async function () {
  this.isLocked = false;
  this.unlockedAt = new Date();
  this.lockedAt = undefined;
  this.lockReason = undefined;
  await this.save();
};

// Static: Get active lock for user
simLockSchema.statics.getActiveLockForUser = async function (userId: string): Promise<ISimLockDocument | null> {
  return this.findOne({ userId, isLocked: true }).exec();
};

// Static: Get all locks for user (with history)
simLockSchema.statics.getUserLockHistory = async function (userId: string): Promise<ISimLockDocument[]> {
  return this.find({ userId }).sort({ lockedAt: -1 }).exec();
};

// Export SimLock model
export const SimLock = model<ISimLockDocument>('SimLock', simLockSchema);
