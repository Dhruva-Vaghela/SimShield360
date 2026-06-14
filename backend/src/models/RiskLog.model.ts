import { Schema, Document, model, Types } from 'mongoose';

// Types
export interface IRiskFactors {
  deviceTrust: number;
  locationAnomaly: number;
  timeAnomaly: number;
  behaviorScore: number;
  accountAge: number;
  previousSwaps: number;
  telecomIntelligence: number;
}

export interface IRiskLog {

  requestId: string;
  userId: Types.ObjectId;
  riskFactors: IRiskFactors;
  aggregatedScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  calculatedAt: Date;
  createdAt: Date;
}

// Custom document interface
export interface IRiskLogDocument extends IRiskLog, Document { _id: any; }

// RiskLog Schema
const riskLogSchema = new Schema<IRiskLogDocument>(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    riskFactors: {
      deviceTrust: { type: Number, required: true, min: 0, max: 100 },
      locationAnomaly: { type: Number, required: true, min: 0, max: 100 },
      timeAnomaly: { type: Number, required: true, min: 0, max: 100 },
      behaviorScore: { type: Number, required: true, min: 0, max: 100 },
      accountAge: { type: Number, required: true, min: 0, max: 100 },
      previousSwaps: { type: Number, required: true, min: 0, max: 100 },
      telecomIntelligence: { type: Number, required: true, min: 0, max: 100 },
    },
    aggregatedScore: {
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
    recommendations: {
      type: [String],
      default: [],
    },
    calculatedAt: {
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
riskLogSchema.index({ userId: 1, calculatedAt: -1 });

// Compound index for risk level queries
riskLogSchema.index({ riskLevel: 1, calculatedAt: -1 });

// Compound index for request queries
riskLogSchema.index({ requestId: 1, calculatedAt: -1 });

// Compound index for analytics
riskLogSchema.index({ calculatedAt: 1, riskLevel: 1 });

// Static: Get risk log by request ID
riskLogSchema.statics.getByRequestId = async function (requestId: string) {
  return this.findOne({ requestId }).exec();
};

// Static: Get risk logs by user
riskLogSchema.statics.getUserRiskLogs = async function (userId: string, limit: number = 20) {
  return this.find({ userId })
    .sort({ calculatedAt: -1 })
    .limit(limit)
    .exec();
};

// Static: Get recent risk logs by level
riskLogSchema.statics.getRecentRiskLogsByLevel = async function (
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  limit: number = 50
) {
  return this.find({ riskLevel })
    .sort({ calculatedAt: -1 })
    .limit(limit)
    .exec();
};

// Static: Get risk analytics summary
riskLogSchema.statics.getRiskAnalytics = async function (days: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const pipeline = [
    { $match: { calculatedAt: { $gte: cutoffDate } } },
    {
      $group: {
        _id: '$riskLevel',
        count: { $sum: 1 },
        avgScore: { $avg: '$aggregatedScore' },
        minScore: { $min: '$aggregatedScore' },
        maxScore: { $max: '$aggregatedScore' },
      },
    },
    { $sort: { count: -1 as const } },
  ] as any[];

  return this.aggregate(pipeline).exec();
};

// Static: Create risk log
riskLogSchema.statics.createRiskLog = async function (
  requestId: string,
  userId: string,
  riskFactors: IRiskFactors,
  aggregatedScore: number,
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  recommendations: string[] = []
): Promise<IRiskLogDocument> {
  return this.create({
    requestId,
    userId,
    riskFactors,
    aggregatedScore,
    riskLevel,
    recommendations,
    calculatedAt: new Date(),
  });
};

// Method: Update recommendations
riskLogSchema.methods.updateRecommendations = async function (recommendations: string[]) {
  this.recommendations = recommendations;
  await this.save();
};

// Export RiskLog model
export const RiskLog = model<IRiskLogDocument>('RiskLog', riskLogSchema);
