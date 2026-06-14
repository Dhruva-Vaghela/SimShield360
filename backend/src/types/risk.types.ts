import { RiskLevel } from './common.types';

// Risk factors
export interface RiskFactors {
  deviceTrust: number;
  locationAnomaly: number;
  timeAnomaly: number;
  behaviorScore: number;
  accountAge: number;
  previousSwaps: number;
  telecomIntelligence: number;
}

// Risk assessment
export interface RiskAssessment {
  aggregatedScore: number;
  riskLevel: RiskLevel;
  riskFactors: RiskFactors;
  recommendations: string[];
}

// Risk log
export interface RiskLog {
  _id: string;
  requestId: string;
  userId: string;
  riskFactors: RiskFactors;
  aggregatedScore: number;
  riskLevel: RiskLevel;
  recommendations: string[];
  calculatedAt: Date;
  createdAt: Date;
}

// Risk analytics
export interface RiskAnalytics {
  _id: RiskLevel;
  count: number;
  avgScore: number;
  minScore: number;
  maxScore: number;
}

// Risk factor evaluation result
export interface RiskFactorResult {
  factor: string;
  score: number;
  weight: number;
  contribution: number;
  explanation: string;
}

// Decision engine output
export interface DecisionOutput {
  decision: 'approved' | 'denied' | 'pending_manual_review';
  automatic: boolean;
  reason: string;
  riskScore: number;
  riskLevel: RiskLevel;
  reviewedBy?: string;
}

// Risk alert
export interface RiskAlert {
  userId: string;
  requestId: string;
  riskLevel: RiskLevel;
  aggregatedScore: number;
  timestamp: Date;
  notificationSent: boolean;
}

// Risk threshold constants
export const RISK_THRESHOLDS = {
  AUTO_APPROVE: 30,
  AUTO_DENY: 90,
  RISK_LEVELS: {
    LOW: 0,
    MEDIUM: 40,
    HIGH: 60,
    CRITICAL: 80,
  },
} as const;

// Risk weights for aggregation
export const RISK_WEIGHTS = {
  deviceTrust: 0.15,
  locationAnomaly: 0.15,
  timeAnomaly: 0.10,
  behaviorScore: 0.20,
  accountAge: 0.10,
  previousSwaps: 0.15,
  telecomIntelligence: 0.15,
} as const;

// Export all interfaces
export {};
