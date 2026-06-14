import { Schema, Document, model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Types
export type SwapRequestType = 'sim_swap' | 'esim_transfer' | 'port_out';
export type SwapRequestStatus =
  | 'pending'
  | 'processing'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'denied'
  | 'blocked'
  | 'expired'
  | 'cancelled';

export interface ILayerResult {
  layer: number;
  name: string;
  passed: boolean;
  score?: number;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface ISimSwapRequest {
  requestId: string;
  userId: Types.ObjectId;
  currentPhoneNumber: string;
  newPhoneNumber: string;
  newSimCardNumber?: string;
  reason?: string;
  requestType?: SwapRequestType;
  status: SwapRequestStatus;
  layerResults: ILayerResult[];
  riskScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  finalDecision?: 'approved' | 'denied' | 'pending_review' | 'blocked';
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: { latitude?: number; longitude?: number; country?: string };
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  cancelledAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Custom document interface
export interface ISimSwapRequestDocument extends ISimSwapRequest, Document { _id: any; }

// SimSwapRequest Schema
const simSwapRequestSchema = new Schema<ISimSwapRequestDocument>(
  {
    requestId: { type: String, required: true, unique: true, index: true, default: () => uuidv4() },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    currentPhoneNumber: { type: String, required: true, trim: true },
    newPhoneNumber: { type: String, required: true, trim: true },
    newSimCardNumber: { type: String, trim: true },
    reason: { type: String, maxlength: 1000 },
    requestType: { type: String, enum: ['sim_swap', 'esim_transfer', 'port_out'], default: 'sim_swap' },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'pending_review', 'approved', 'rejected', 'denied', 'blocked', 'expired', 'cancelled'],
      default: 'pending',
      index: true,
    },
    layerResults: [
      {
        layer: { type: Number },
        name: { type: String },
        passed: { type: Boolean },
        score: { type: Number },
        details: { type: Schema.Types.Mixed },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    riskScore: { type: Number, min: 0, max: 100 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    finalDecision: { type: String, enum: ['approved', 'denied', 'pending_review', 'blocked'] },
    deviceFingerprint: { type: String, trim: true },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      country: { type: String, trim: true },
    },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, maxlength: 2000 },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    cancelledAt: { type: Date },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
    id: true,
  }
);

// Indexes
simSwapRequestSchema.index({ userId: 1, createdAt: -1 });
simSwapRequestSchema.index({ status: 1, createdAt: -1 });
simSwapRequestSchema.index({ riskLevel: 1, createdAt: -1 });

// Static: Get pending requests for agent review
simSwapRequestSchema.statics.getPendingRequests = async function (limit: number = 20, offset: number = 0) {
  return this.find({ status: 'pending_review' })
    .sort({ createdAt: 1 })
    .skip(offset)
    .limit(limit)
    .exec();
};

// Static: Get user's recent requests
simSwapRequestSchema.statics.getUserRecentRequests = async function (userId: string, limit: number = 10) {
  return this.find({ userId }).sort({ createdAt: -1 }).limit(limit).exec();
};

// Export SimSwapRequest model
export const SimSwapRequest = model<ISimSwapRequestDocument>('SimSwapRequest', simSwapRequestSchema);
