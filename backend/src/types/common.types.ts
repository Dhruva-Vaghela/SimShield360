import { Request } from 'express';

// User roles
export type UserRole = 'customer' | 'agent' | 'admin';

// Permission definitions
export const Permissions = {
  customer: [
    'read:own_profile',
    'update:own_profile',
    'create:swap_request',
    'read:own_swap_requests',
    'cancel:own_swap_request',
    'create:simlock',
    'update:own_simlock',
    'read:own_devices',
    'create:device',
    'delete:own_device',
    'read:own_notifications',
    'read:own_risk_logs',
  ] as const,
  agent: [
    'read:all_swap_requests',
    'approve:swap_request',
    'deny:swap_request',
    'read:risk_assessments',
    'read:audit_logs',
    'read:risk_analytics',
    'read:all_notifications',
    'read:all_users',
  ] as const,
  admin: ['*'] as const,
} as const;

// Auth request interface with user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
  };
}

// Pagination interface
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// API response interfaces
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ApiError;
  pagination?: Pagination;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

// Risk level
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Location interface
export interface Location {
  latitude: number;
  longitude: number;
  country: string;
  city?: string;
  timezone?: string;
}

// Request type
export type SwapRequestType = 'sim_swap' | 'esim_transfer' | 'port_out';

// Request status
export type SwapRequestStatus =
  | 'pending'
  | 'layer1_blocked'
  | 'layer2_pending'
  | 'layer2_failed'
  | 'layer3_pending'
  | 'layer3_failed'
  | 'layer4_pending'
  | 'layer4_failed'
  | 'layer5_processing'
  | 'layer6_processing'
  | 'layer7_pending_manual'
  | 'approved'
  | 'denied'
  | 'expired'
  | 'cancelled';

// Decision
export type Decision = 'approved' | 'denied' | 'pending_manual_review';

// JWT payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Token responses
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// Password reset token
export interface PasswordResetToken {
  token: string;
  userId: string;
  expiresAt: Date;
}

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

// Layer results
export interface LayerResults {
  layer1?: { passed: boolean; timestamp: Date; reason?: string };
  layer2?: { passed: boolean; timestamp: Date; faceMatchScore?: number };
  layer3?: { passed: boolean; timestamp: Date };
  layer4?: { passed: boolean; timestamp: Date; deviceId?: string };
  layer5?: { passed: boolean; timestamp: Date; intelligenceData?: Record<string, unknown> };
  layer6?: { passed: boolean; timestamp: Date; riskScore?: number };
  layer7?: { passed: boolean; timestamp: Date; decision: string; reviewedBy?: string };
}

// Verification session data
export interface VerificationSessionData {
  sessionId: string;
  sessionType: 'face' | 'authenticator' | 'device_consent';
  status: 'pending' | 'verified' | 'failed' | 'expired';
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  completedAt?: Date;
}

// Rate limiting
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  headers: boolean;
}

// External API responses
export interface FaceVerificationResponse {
  success: boolean;
  matchScore?: number;
  faceEncoding?: number[];
  errorMessage?: string;
}

export interface RiskAssessmentResponse {
  aggregatedScore: number;
  riskLevel: RiskLevel;
  riskFactors: RiskFactors;
  recommendations: string[];
}

export interface DecisionResponse {
  decision: Decision;
  automatic: boolean;
  reason: string;
  reviewedBy?: string;
}

// Export all interfaces
export {};
