import { ObjectId } from 'mongoose';
import { Location, RiskLevel, SwapRequestType, SwapRequestStatus, Decision } from './common.types';

// Layer results for swap requests
export interface LayerResult {
  passed: boolean;
  timestamp: Date;
  reason?: string;
  faceMatchScore?: number;
  deviceId?: string;
  intelligenceData?: Record<string, unknown>;
  riskScore?: number;
  reviewedBy?: string;
}

export interface LayerResults {
  layer1?: LayerResult;
  layer2?: LayerResult;
  layer3?: LayerResult;
  layer4?: LayerResult;
  layer5?: LayerResult;
  layer6?: LayerResult;
  layer7?: LayerResult;
}

// Swap request interface
export interface ISimSwapRequest {
  _id: ObjectId;
  requestId: string;
  userId: ObjectId;
  requestType: SwapRequestType;
  status: SwapRequestStatus;
  currentLayer: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  layerResults: LayerResults;
  riskScore?: number;
  riskLevel?: RiskLevel;
  deviceFingerprint?: string;
  ipAddress?: string;
  location?: Location;
  agentReview?: {
    reviewedBy: ObjectId;
    reviewedAt: Date;
    decision: 'approved' | 'denied';
    comments?: string;
  };
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Swap request creation request
export interface CreateSwapRequestRequest {
  requestType: SwapRequestType;
  deviceFingerprint: string;
  ipAddress: string;
  location: {
    latitude: number;
    longitude: number;
    country: string;
  };
}

// Swap request response
export interface SwapRequestResponse {
  requestId: string;
  status: SwapRequestStatus;
  currentLayer: number;
  riskScore?: number;
  riskLevel?: RiskLevel;
  createdAt: Date;
  expiresAt: Date;
}

// Swap request with details
export interface SwapRequestWithDetails extends ISimSwapRequest {
  user?: {
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
    role: string;
  };
}

// Swap request list response
export interface SwapRequestListResponse {
  requests: SwapRequestResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Agent review request
export interface AgentReviewRequest {
  reviewedBy: string;
  decision: 'approved' | 'denied';
  comments?: string;
}

// Manual review response
export interface ManualReviewResponse {
  requestId: string;
  status: SwapRequestStatus;
  reviewedBy: string;
  reviewedAt: Date;
  decision: 'approved' | 'denied';
  comments?: string;
}

// Export all interfaces
export {};
