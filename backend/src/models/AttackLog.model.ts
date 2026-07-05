import { Schema, Document, model } from 'mongoose';

export interface IAttackLogEntry {
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface IAttackLog {
  requestId: string;
  targetCustomer: string;
  customerNumber: string;
  attackType: 'sim_swap' | 'esim_transfer' | 'port_out' | 'sim_replacement';
  location: string;
  device: string;
  network: string;
  fakeDocuments: boolean;
  multipleAttempts: boolean;
  status: 'started' | 'waiting' | 'blocked' | 'rejected' | 'succeeded';
  currentLayer: string;
  riskScore: number;
  detectionStatus?: string;
  logs: IAttackLogEntry[];
  timestamp: Date;
}

export interface IAttackLogDocument extends IAttackLog, Document {
  _id: any;
}

const attackLogSchema = new Schema<IAttackLogDocument>(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    targetCustomer: {
      type: String,
      required: true,
      trim: true,
    },
    customerNumber: {
      type: String,
      required: true,
      trim: true,
    },
    attackType: {
      type: String,
      required: true,
      enum: ['sim_swap', 'esim_transfer', 'port_out', 'sim_replacement'],
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    device: {
      type: String,
      required: true,
      trim: true,
    },
    network: {
      type: String,
      required: true,
      trim: true,
    },
    fakeDocuments: {
      type: Boolean,
      required: true,
      default: false,
    },
    multipleAttempts: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: String,
      required: true,
      enum: ['started', 'waiting', 'blocked', 'rejected', 'succeeded'],
      default: 'started',
      index: true,
    },
    currentLayer: {
      type: String,
      required: true,
      default: 'None',
    },
    riskScore: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    detectionStatus: {
      type: String,
      trim: true,
    },
    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
        message: { type: String, required: true },
      },
    ],
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
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

// Indexes
attackLogSchema.index({ targetCustomer: 1, timestamp: -1 });
attackLogSchema.index({ attackType: 1, timestamp: -1 });
attackLogSchema.index({ status: 1, timestamp: -1 });

// Export AttackLog model
export const AttackLog = model<IAttackLogDocument>('AttackLog', attackLogSchema);
