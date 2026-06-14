import { Schema, Document, model, Types } from 'mongoose';

// Types
export type SessionType = 'face' | 'authenticator' | 'device_consent';
export type SessionStatus = 'pending' | 'verified' | 'failed' | 'expired';

export interface IVerificationSession {

  requestId: string;
  userId: Types.ObjectId;
  sessionType: SessionType;
  status: SessionStatus;
  attempts: number;
  maxAttempts: number;
  verificationData?: Record<string, unknown>;
  expiresAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Custom document interface
export interface IVerificationSessionDocument extends IVerificationSession, Document { _id: any; }

// VerificationSession Schema
const verificationSessionSchema = new Schema<IVerificationSessionDocument>(
  {
    requestId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionType: {
      type: String,
      required: true,
      enum: ['face', 'authenticator', 'device_consent'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'verified', 'failed', 'expired'],
      default: 'pending',
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      required: true,
      default: 3,
      min: 1,
      max: 10,
    },
    verificationData: {
      type: Schema.Types.Mixed,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    completedAt: {
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
        delete ret.verificationData;
        return ret;
      },
    },
    toObject: {
      transform: (_, ret) => {
        delete ret.verificationData;
        return ret;
      },
    },
  }
);

// Compound index for session lookup
verificationSessionSchema.index({ requestId: 1, sessionType: 1 }, { unique: true });

// Compound index for pending sessions
verificationSessionSchema.index({ userId: 1, status: 1, expiresAt: 1 });

// Compound index for session type queries
verificationSessionSchema.index({ sessionType: 1, status: 1, expiresAt: 1 });

// TTL index for automatic cleanup of expired sessions
verificationSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static: Get active session by request and type
verificationSessionSchema.statics.getActiveSession = async function (
  requestId: string,
  sessionType: SessionType
) {
  return this.findOne({
    requestId,
    sessionType,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  }).exec();
};

// Static: Get session by request ID
verificationSessionSchema.statics.getByRequestId = async function (requestId: string) {
  return this.find({ requestId }).sort({ createdAt: -1 }).exec();
};

// Static: Get pending sessions for user
verificationSessionSchema.statics.getUserPendingSessions = async function (userId: string) {
  return this.find({
    userId,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  }).exec();
};

// Static: Create new session
verificationSessionSchema.statics.createSession = async function (
  requestId: string,
  userId: string,
  sessionType: SessionType,
  maxAttempts: number = 3,
  ttlMinutes: number = 10
): Promise<IVerificationSessionDocument> {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  const session = await this.create({
    requestId,
    userId,
    sessionType,
    maxAttempts,
    expiresAt,
  });

  return session;
};

// Static: Mark session as verified
verificationSessionSchema.statics.markVerified = async function (
  sessionId: string,
  verificationData?: Record<string, unknown>
): Promise<void> {
  await this.findByIdAndUpdate(sessionId, {
    status: 'verified',
    verificationData,
    completedAt: new Date(),
    attempts: 0,
  }).exec();
};

// Static: Mark session as failed
verificationSessionSchema.statics.markFailed = async function (sessionId: string): Promise<void> {
  await this.findByIdAndUpdate(sessionId, {
    status: 'failed',
    completedAt: new Date(),
  }).exec();
};

// Static: Mark session as expired
verificationSessionSchema.statics.markExpired = async function (sessionId: string): Promise<void> {
  await this.findByIdAndUpdate(sessionId, {
    status: 'expired',
    completedAt: new Date(),
  }).exec();
};

// Method: Increment attempts
verificationSessionSchema.methods.incrementAttempts = async function () {
  this.attempts += 1;
  await this.save();
};

// Method: Check if session is expired
verificationSessionSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt;
};

// Method: Check if max attempts exceeded
verificationSessionSchema.methods.maxAttemptsExceeded = function (): boolean {
  return this.attempts >= this.maxAttempts;
};

// Export VerificationSession model
export const VerificationSession = model<IVerificationSessionDocument>(
  'VerificationSession',
  verificationSessionSchema
);
