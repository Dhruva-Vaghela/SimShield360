import { Schema, Document, model, Types, Model } from 'mongoose';

// Types
export interface IFaceProfile {

  userId: Types.ObjectId;
  faceEncodingData: string; // Encrypted face encoding vector
  capturedAt: Date;
  isActive: boolean;
  verificationCount: number;
  lastVerifiedAt?: Date;
  confidenceScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Custom document interface
export interface IFaceProfileDocument extends IFaceProfile, Document {
  _id: any;
  incrementVerificationCount(): Promise<void>;
  updateConfidenceScore(score: number): Promise<void>;
  deactivate(): Promise<void>;
  activate(): Promise<void>;
}

export interface IFaceProfileModel extends Model<IFaceProfileDocument> {
  getActiveProfile(userId: string): Promise<IFaceProfileDocument | null>;
  getAllProfiles(userId: string): Promise<IFaceProfileDocument[]>;
  upsertProfile(userId: string, faceEncodingData: string, confidenceScore?: number): Promise<IFaceProfileDocument>;
}

// FaceProfile Schema
const faceProfileSchema = new Schema<IFaceProfileDocument, IFaceProfileModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    faceEncodingData: {
      type: String,
      required: true,
      select: false,
    },
    capturedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    verificationCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastVerifiedAt: {
      type: Date,
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
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
        delete ret.faceEncodingData;
        return ret;
      },
    },
    toObject: {
      transform: (_, ret) => {
        delete ret.faceEncodingData;
        return ret;
      },
    },
  }
);

// Index for active profiles
faceProfileSchema.index({ isActive: 1 });

// Index for verification history
faceProfileSchema.index({ lastVerifiedAt: -1 });

// Static: Get active profile for user
faceProfileSchema.statics.getActiveProfile = async function (userId: string) {
  return this.findOne({ userId, isActive: true }).select('+faceEncodingData').exec();
};

// Static: Get all profiles for user (including inactive)
faceProfileSchema.statics.getAllProfiles = async function (userId: string) {
  return this.find({ userId }).sort({ capturedAt: -1 }).exec();
};

// Static: Create or update profile
faceProfileSchema.statics.upsertProfile = async function (
  userId: string,
  faceEncodingData: string,
  confidenceScore?: number
): Promise<IFaceProfileDocument> {
  // Deactivate existing profile
  await this.updateOne({ userId, isActive: true }, { isActive: false }).exec();

  // Create new active profile
  const profile = await this.create({
    userId,
    faceEncodingData,
    isActive: true,
    capturedAt: new Date(),
    confidenceScore,
  });

  return profile;
};

// Static: Update verification count
faceProfileSchema.methods.incrementVerificationCount = async function () {
  this.verificationCount += 1;
  this.lastVerifiedAt = new Date();
  await this.save();
};

// Static: Update confidence score
faceProfileSchema.methods.updateConfidenceScore = async function (score: number) {
  this.confidenceScore = score;
  await this.save();
};

// Static: Deactivate profile
faceProfileSchema.methods.deactivate = async function () {
  this.isActive = false;
  await this.save();
};

// Static: Activate profile
faceProfileSchema.methods.activate = async function () {
  this.isActive = true;
  await this.save();
};

// Export FaceProfile model
export const FaceProfile = model<IFaceProfileDocument, IFaceProfileModel>('FaceProfile', faceProfileSchema);
