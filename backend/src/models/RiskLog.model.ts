import { Schema, Document, model, Model, Types } from 'mongoose';

// Types
export interface IRiskFactor {
  name: string;
  weight: number;
  score: number;
  weightedScore: number;
  status: 'pass' | 'fail' | 'warning';
  details: any;
}

export interface IRiskLog {
  swapRequestId?: string;
  userId: Types.ObjectId;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  decision: 'approved' | 'rejected' | 'blocked' | 'pending_review';
  factors: IRiskFactor[];
  ipAddress: string;
  assessmentDate: Date;
  createdAt: Date;
}

// Custom document interface
export interface IRiskLogDocument extends IRiskLog, Document { _id: any; }

export interface IRiskLogModel extends Model<IRiskLogDocument> {
  getByRequestId(requestId: string): Promise<IRiskLogDocument | null>;
  getUserRiskLogs(userId: string, limit?: number): Promise<IRiskLogDocument[]>;
  getRecentRiskLogsByLevel(riskLevel: 'low' | 'medium' | 'high' | 'critical', limit?: number): Promise<IRiskLogDocument[]>;
  getRiskAnalytics(days?: number): Promise<any[]>;
  createRiskLog(data: {
    swapRequestId?: string;
    userId: string;
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    decision: 'approved' | 'rejected' | 'blocked' | 'pending_review';
    factors: IRiskFactor[];
    ipAddress: string;
    assessmentDate?: Date;
  }): Promise<IRiskLogDocument>;
}

// RiskLog Schema
const riskLogSchema = new Schema<IRiskLogDocument>(
  {
    swapRequestId: {
      type: String,
      required: false,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    decision: {
      type: String,
      required: true,
      enum: ['approved', 'rejected', 'blocked', 'pending_review'],
    },
    factors: [
      {
        name: { type: String, required: true },
        weight: { type: Number, required: true },
        score: { type: Number, required: true },
        weightedScore: { type: Number, required: true },
        status: { type: String, required: true, enum: ['pass', 'fail', 'warning'] },
        details: { type: Schema.Types.Mixed },
      },
    ],
    ipAddress: {
      type: String,
      required: true,
    },
    assessmentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
    versionKey: false,
    id: true,
  }
);

// Compound index for risk logs by user
riskLogSchema.index({ userId: 1, assessmentDate: -1 });

// Compound index for risk level queries
riskLogSchema.index({ riskLevel: 1, assessmentDate: -1 });

// Compound index for request queries
riskLogSchema.index({ swapRequestId: 1, assessmentDate: -1 });

// Compound index for analytics
riskLogSchema.index({ assessmentDate: 1, riskLevel: 1 });

// Static: Get risk log by request ID
riskLogSchema.statics.getByRequestId = async function (swapRequestId: string) {
  return this.findOne({ swapRequestId }).exec();
};

// Static: Get risk logs by user
riskLogSchema.statics.getUserRiskLogs = async function (userId: string, limit: number = 20) {
  return this.find({ userId })
    .sort({ assessmentDate: -1 })
    .limit(limit)
    .exec();
};

// Static: Get recent risk logs by level
riskLogSchema.statics.getRecentRiskLogsByLevel = async function (
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  limit: number = 50
) {
  return this.find({ riskLevel })
    .sort({ assessmentDate: -1 })
    .limit(limit)
    .exec();
};

// Static: Get risk analytics summary
riskLogSchema.statics.getRiskAnalytics = async function (days: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const pipeline = [
    { $match: { assessmentDate: { $gte: cutoffDate } } },
    {
      $group: {
        _id: '$riskLevel',
        count: { $sum: 1 },
        avgScore: { $avg: '$riskScore' },
        minScore: { $min: '$riskScore' },
        maxScore: { $max: '$riskScore' },
      },
    },
    { $sort: { count: -1 as const } },
  ] as any[];

  return this.aggregate(pipeline).exec();
};

// Static: Create risk log
riskLogSchema.statics.createRiskLog = async function (data: {
  swapRequestId?: string;
  userId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  decision: 'approved' | 'rejected' | 'blocked' | 'pending_review';
  factors: IRiskFactor[];
  ipAddress: string;
  assessmentDate?: Date;
}): Promise<IRiskLogDocument> {
  return this.create({
    swapRequestId: data.swapRequestId,
    userId: data.userId,
    riskScore: data.riskScore,
    riskLevel: data.riskLevel,
    decision: data.decision,
    factors: data.factors,
    ipAddress: data.ipAddress,
    assessmentDate: data.assessmentDate || new Date(),
  });
};

// Export RiskLog model
export const RiskLog = model<IRiskLogDocument, IRiskLogModel>('RiskLog', riskLogSchema);
