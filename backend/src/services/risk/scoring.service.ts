import logger from '../../utils/logger.util';
import { User } from '../../models/User.model';
import { SimSwapRequest } from '../../models/SimSwapRequest.model';
import { TrustedDevice } from '../../models/TrustedDevice.model';
import { RiskLog } from '../../models/RiskLog.model';

/**
 * Risk Factor Weights (Total = 100)
 */
export const RISK_WEIGHTS = {
  SIM_LOCK_STATUS: 25,           // Layer 1: SIM Lock Check
  FACE_VERIFICATION: 20,          // Layer 2: Biometric Match
  AUTHENTICATOR_VERIFICATION: 15, // Layer 3: TOTP Validation
  TRUSTED_DEVICE: 15,             // Layer 4: Device Trust
  LOCATION_ANALYSIS: 10,          // Geographic Risk
  DEVICE_CHANGE_ANALYSIS: 5,      // Device Pattern Changes
  FAILED_ATTEMPTS: 5,             // Recent Failed Attempts
  RECENT_SIM_CHANGES: 3,          // SIM Change History
  PORT_OUT_ACTIVITY: 2,           // Port-Out Attempts
} as const;

/**
 * Risk Levels
 */
export enum RiskLevel {
  LOW = 'low',           // 0-30
  MEDIUM = 'medium',     // 31-70
  HIGH = 'high',         // 71-100
  CRITICAL = 'critical', // 100 (immediate block)
}

/**
 * Decision Types
 */
export enum DecisionType {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
  PENDING_REVIEW = 'pending_review',
}

/**
 * Risk Factor Result Interface
 */
export interface RiskFactorResult {
  factorName: string;
  weight: number;
  score: number;          // 0-100 (100 = highest risk)
  weightedScore: number;  // score * (weight/100)
  status: 'pass' | 'fail' | 'warning';
  details: any;
}

/**
 * Risk Assessment Input
 */
export interface RiskAssessmentInput {
  userId: string;
  swapRequestId?: string;
  phoneNumber: string;
  newPhoneNumber?: string;
  deviceFingerprint?: string;
  ipAddress: string;
  userAgent?: string;
  
  // Layer results from workflow
  simLockStatus?: boolean;
  faceVerificationScore?: number;
  authenticatorVerified?: boolean;
  trustedDevice?: boolean;
  
  // Additional context
  location?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

/**
 * Risk Assessment Result
 */
export interface RiskAssessmentResult {
  success: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  decision: DecisionType;
  factors: RiskFactorResult[];
  recommendations: string[];
  requiresManualReview: boolean;
  blockReasons?: string[];
  errorMessage?: string;
}

/**
 * Risk Scoring Service - Central Fraud Prevention Brain
 */
export class RiskScoringService {
  /**
   * Calculate comprehensive risk score
   */
  async calculateRiskScore(input: RiskAssessmentInput): Promise<RiskAssessmentResult> {
    try {
      logger.info('Starting risk assessment', {
        userId: input.userId,
        swapRequestId: input.swapRequestId,
        phoneNumber: input.phoneNumber,
      });

      const factors: RiskFactorResult[] = [];
      const blockReasons: string[] = [];
      const recommendations: string[] = [];

      // Factor 1: SIM Lock Status (Weight: 25)
      const simLockFactor = await this.assessSimLockStatus(input);
      factors.push(simLockFactor);
      if (simLockFactor.status === 'fail') {
        blockReasons.push('SIM lock is active - request blocked');
      }

      // Factor 2: Face Verification (Weight: 20)
      const faceFactor = await this.assessFaceVerification(input);
      factors.push(faceFactor);
      if (faceFactor.score > 50) {
        recommendations.push('Face verification failed or not completed');
      }

      // Factor 3: Authenticator Verification (Weight: 15)
      const authenticatorFactor = await this.assessAuthenticator(input);
      factors.push(authenticatorFactor);
      if (authenticatorFactor.score > 50) {
        recommendations.push('Two-factor authentication not verified');
      }

      // Factor 4: Trusted Device (Weight: 15)
      const deviceTrustFactor = await this.assessTrustedDevice(input);
      factors.push(deviceTrustFactor);
      if (deviceTrustFactor.score > 50) {
        recommendations.push('Request from untrusted device');
      }

      // Factor 5: Location Analysis (Weight: 10)
      const locationFactor = await this.assessLocationRisk(input);
      factors.push(locationFactor);
      if (locationFactor.score > 70) {
        recommendations.push('Suspicious location detected');
      }

      // Factor 6: Device Change Analysis (Weight: 5)
      const deviceChangeFactor = await this.assessDeviceChangePattern(input);
      factors.push(deviceChangeFactor);

      // Factor 7: Failed Attempts (Weight: 5)
      const failedAttemptsFactor = await this.assessFailedAttempts(input);
      factors.push(failedAttemptsFactor);
      if (failedAttemptsFactor.score > 70) {
        blockReasons.push('Multiple failed attempts detected');
      }

      // Factor 8: Recent SIM Changes (Weight: 3)
      const simChangeHistoryFactor = await this.assessRecentSimChanges(input);
      factors.push(simChangeHistoryFactor);
      if (simChangeHistoryFactor.score > 80) {
        recommendations.push('Multiple recent SIM changes detected');
      }

      // Factor 9: Port-Out Activity (Weight: 2)
      const portOutFactor = await this.assessPortOutActivity(input);
      factors.push(portOutFactor);
      if (portOutFactor.score > 80) {
        blockReasons.push('Recent port-out attempt detected');
      }

      // Calculate total weighted risk score
      const totalRiskScore = factors.reduce(
        (sum, factor) => sum + factor.weightedScore,
        0
      );

      // Determine risk level
      const riskLevel = this.determineRiskLevel(totalRiskScore);

      // Make decision
      const decision = this.makeDecision(totalRiskScore, blockReasons);

      // Save risk log
      await this.saveRiskLog({
        userId: input.userId,
        swapRequestId: input.swapRequestId,
        riskScore: totalRiskScore,
        riskLevel,
        decision,
        factors,
        ipAddress: input.ipAddress,
      });

      logger.info('Risk assessment completed', {
        userId: input.userId,
        riskScore: totalRiskScore,
        riskLevel,
        decision,
      });

      return {
        success: true,
        riskScore: Math.round(totalRiskScore * 10) / 10, // Round to 1 decimal
        riskLevel,
        decision,
        factors,
        recommendations,
        requiresManualReview: decision === DecisionType.PENDING_REVIEW,
        blockReasons: blockReasons.length > 0 ? blockReasons : undefined,
      };
    } catch (error) {
      logger.error('Risk assessment error:', error);
      return {
        success: false,
        riskScore: 100,
        riskLevel: RiskLevel.CRITICAL,
        decision: DecisionType.BLOCKED,
        factors: [],
        recommendations: ['Error during risk assessment - request blocked for safety'],
        requiresManualReview: false,
        errorMessage: 'Failed to complete risk assessment',
      };
    }
  }

  /**
   * Factor 1: Assess SIM Lock Status
   */
  private async assessSimLockStatus(input: RiskAssessmentInput): Promise<RiskFactorResult> {
    try {
      const SimLock = (await import('../../models/SimLock.model')).SimLock;
      
      const simLock = await SimLock.findOne({
        userId: input.userId,
        phoneNumber: input.phoneNumber,
        isLocked: true,
      });

      const isLocked = !!simLock;
      const score = isLocked ? 100 : 0; // Binary: locked = 100% risk

      return {
        factorName: 'SIM Lock Status',
        weight: RISK_WEIGHTS.SIM_LOCK_STATUS,
        score,
        weightedScore: (score * RISK_WEIGHTS.SIM_LOCK_STATUS) / 100,
        status: isLocked ? 'fail' : 'pass',
        details: {
          isLocked,
          lockId: simLock?._id,
          lockedAt: simLock?.lockedAt,
          message: isLocked ? 'SIM lock is active' : 'No active SIM lock',
        },
      };
    } catch (error) {
      logger.error('SIM lock assessment error:', error);
      return this.createErrorFactor('SIM Lock Status', RISK_WEIGHTS.SIM_LOCK_STATUS);
    }
  }

  /**
   * Factor 2: Assess Face Verification
   */
  private async assessFaceVerification(input: RiskAssessmentInput): Promise<RiskFactorResult> {
    try {
      const matchScore = input.faceVerificationScore || 0;
      const threshold = 85; // 85% match required

      // Convert match score to risk score (inverse relationship)
      // High match (90%) = Low risk (10%)
      // Low match (50%) = High risk (50%)
      const score = Math.max(0, 100 - matchScore);

      return {
        factorName: 'Face Verification',
        weight: RISK_WEIGHTS.FACE_VERIFICATION,
        score,
        weightedScore: (score * RISK_WEIGHTS.FACE_VERIFICATION) / 100,
        status: matchScore >= threshold ? 'pass' : matchScore > 0 ? 'warning' : 'fail',
        details: {
          matchScore,
          threshold,
          verified: matchScore >= threshold,
          message: matchScore >= threshold
            ? 'Face verification passed'
            : matchScore > 0
            ? 'Face verification below threshold'
            : 'Face verification not completed',
        },
      };
    } catch (error) {
      logger.error('Face verification assessment error:', error);
      return this.createErrorFactor('Face Verification', RISK_WEIGHTS.FACE_VERIFICATION);
    }
  }

  /**
   * Factor 3: Assess Authenticator Verification
   */
  private async assessAuthenticator(input: RiskAssessmentInput): Promise<RiskFactorResult> {
    try {
      const verified = input.authenticatorVerified || false;
      const score = verified ? 0 : 70; // Not verified = 70% risk

      // Check if user has authenticator enabled
      const user = await User.findById(input.userId).select('authenticator');
      const hasAuthenticator = user?.authenticator?.isEnabled || false;

      return {
        factorName: 'Authenticator Verification',
        weight: RISK_WEIGHTS.AUTHENTICATOR_VERIFICATION,
        score,
        weightedScore: (score * RISK_WEIGHTS.AUTHENTICATOR_VERIFICATION) / 100,
        status: verified ? 'pass' : hasAuthenticator ? 'fail' : 'warning',
        details: {
          verified,
          hasAuthenticator,
          message: verified
            ? 'Authenticator verified'
            : hasAuthenticator
            ? 'Authenticator not verified'
            : 'Authenticator not enabled',
        },
      };
    } catch (error) {
      logger.error('Authenticator assessment error:', error);
      return this.createErrorFactor('Authenticator Verification', RISK_WEIGHTS.AUTHENTICATOR_VERIFICATION);
    }
  }

  /**
   * Factor 4: Assess Trusted Device
   */
  private async assessTrustedDevice(input: RiskAssessmentInput): Promise<RiskFactorResult> {
    try {
      let isTrusted = false;
      let deviceInfo = null;

      if (input.deviceFingerprint) {
        const device = await TrustedDevice.findOne({
          userId: input.userId,
          fingerprint: input.deviceFingerprint,
          isTrusted: true,
        });

        isTrusted = !!device;
        deviceInfo = device;
      }

      const score = isTrusted ? 0 : 60; // Untrusted device = 60% risk

      return {
        factorName: 'Trusted Device',
        weight: RISK_WEIGHTS.TRUSTED_DEVICE,
        score,
        weightedScore: (score * RISK_WEIGHTS.TRUSTED_DEVICE) / 100,
        status: isTrusted ? 'pass' : 'warning',
        details: {
          isTrusted,
          deviceId: deviceInfo?._id,
          deviceName: deviceInfo?.deviceName,
          lastUsedAt: deviceInfo?.lastUsedAt,
          message: isTrusted ? 'Request from trusted device' : 'Request from untrusted device',
        },
      };
    } catch (error) {
      logger.error('Trusted device assessment error:', error);
      return this.createErrorFactor('Trusted Device', RISK_WEIGHTS.TRUSTED_DEVICE);
    }
  }

  /**
   * Factor 5: Assess Location Risk
   */
  private async assessLocationRisk(input: RiskAssessmentInput): Promise<RiskFactorResult> {
    try {
      // Get user's recent locations from swap requests
      const recentRequests = await SimSwapRequest.find({
        userId: input.userId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      })
        .select('ipAddress location')
        .limit(10)
        .lean();

      let score = 0;
      const details: any = {
        currentIp: input.ipAddress,
        historicalIps: recentRequests.map(r => r.ipAddress),
      };

      // Check IP change
      const ipChanged = !recentRequests.some(r => r.ipAddress === input.ipAddress);
      if (ipChanged) {
        score += 40;
        details.ipChanged = true;
      }

      // Check location consistency (if location data available)
      if (input.location?.country) {
        const historicalCountries = recentRequests
          .map(r => r.location?.country)
          .filter(Boolean);

        const countryChanged = historicalCountries.length > 0 &&
          !historicalCountries.includes(input.location.country);

        if (countryChanged) {
          score += 30;
          details.countryChanged = true;
          details.suspiciousLocation = true;
        }

        details.currentCountry = input.location.country;
        details.historicalCountries = [...new Set(historicalCountries)];
      }

      // High-risk countries (configurable)
      const highRiskCountries = ['XX', 'YY']; // Placeholder
      if (input.location?.country && highRiskCountries.includes(input.location.country)) {
        score += 20;
        details.highRiskCountry = true;
      }

      return {
        factorName: 'Location Analysis',
        weight: RISK_WEIGHTS.LOCATION_ANALYSIS,
        score: Math.min(score, 100),
        weightedScore: (Math.min(score, 100) * RISK_WEIGHTS.LOCATION_ANALYSIS) / 100,
        status: score < 30 ? 'pass' : score < 60 ? 'warning' : 'fail',
        details,
      };
    } catch (error) {
      logger.error('Location assessment error:', error);
      return this.createErrorFactor('Location Analysis', RISK_WEIGHTS.LOCATION_ANALYSIS);
    }
  }

  /**
   * Factor 6: Assess Device Change Pattern
   */
  private async assessDeviceChangePattern(input: RiskAssessmentInput): Promise<RiskFactorResult> {
    try {
      // Get user's device history
      const deviceCount = await TrustedDevice.countDocuments({
        userId: input.userId,
      });

      const recentDevices = await TrustedDevice.countDocuments({
        userId: input.userId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      });

      let score = 0;

      // Multiple devices registered recently
      if (recentDevices > 3) {
        score += 50;
      } else if (recentDevices > 1) {
        score += 25;
      }

      // Too many total devices
      if (deviceCount > 10) {
        score += 30;
      } else if (deviceCount > 5) {
        score += 15;
      }

      return {
        factorName: 'Device Change Analysis',
        weight: RISK_WEIGHTS.DEVICE_CHANGE_ANALYSIS,
        score: Math.min(score, 100),
        weightedScore: (Math.min(score, 100) * RISK_WEIGHTS.DEVICE_CHANGE_ANALYSIS) / 100,
        status: score < 30 ? 'pass' : score < 60 ? 'warning' : 'fail',
        details: {
          totalDevices: deviceCount,
          recentDevices,
          message: recentDevices > 2 ? 'Multiple device changes detected' : 'Normal device pattern',
        },
      };
    } catch (error) {
      logger.error('Device change assessment error:', error);
      return this.createErrorFactor('Device Change Analysis', RISK_WEIGHTS.DEVICE_CHANGE_ANALYSIS);
    }
  }

  /**
   * Factor 7: Assess Failed Attempts
   */
  private async assessFailedAttempts(input: RiskAssessmentInput): Promise<RiskFactorResult> {
    try {
      // Get failed swap requests in last 24 hours
      const failedRequests = await SimSwapRequest.countDocuments({
        userId: input.userId,
        status: 'rejected',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      let score = 0;

      if (failedRequests >= 5) {
        score = 100; // Block immediately
      } else if (failedRequests >= 3) {
        score = 80;
      } else if (failedRequests >= 2) {
        score = 50;
      } else if (failedRequests === 1) {
        score = 25;
      }

      return {
        factorName: 'Failed Attempts',
        weight: RISK_WEIGHTS.FAILED_ATTEMPTS,
        score,
        weightedScore: (score * RISK_WEIGHTS.FAILED_ATTEMPTS) / 100,
        status: score < 30 ? 'pass' : score < 70 ? 'warning' : 'fail',
        details: {
          failedRequests,
          timeWindow: '24 hours',
          message: failedRequests > 0
            ? `${failedRequests} failed attempt(s) in last 24 hours`
            : 'No recent failed attempts',
        },
      };
    } catch (error) {
      logger.error('Failed attempts assessment error:', error);
      return this.createErrorFactor('Failed Attempts', RISK_WEIGHTS.FAILED_ATTEMPTS);
    }
  }

  /**
   * Factor 8: Assess Recent SIM Changes
   */
  private async assessRecentSimChanges(input: RiskAssessmentInput): Promise<RiskFactorResult> {
    try {
      // Get successful swap requests in last 90 days
      const recentSwaps = await SimSwapRequest.countDocuments({
        userId: input.userId,
        status: 'approved',
        createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      });

      let score = 0;

      if (recentSwaps >= 3) {
        score = 90; // Multiple swaps = very suspicious
      } else if (recentSwaps === 2) {
        score = 60;
      } else if (recentSwaps === 1) {
        score = 30;
      }

      return {
        factorName: 'Recent SIM Changes',
        weight: RISK_WEIGHTS.RECENT_SIM_CHANGES,
        score,
        weightedScore: (score * RISK_WEIGHTS.RECENT_SIM_CHANGES) / 100,
        status: score < 40 ? 'pass' : score < 70 ? 'warning' : 'fail',
        details: {
          recentSwaps,
          timeWindow: '90 days',
          message: recentSwaps > 0
            ? `${recentSwaps} SIM change(s) in last 90 days`
            : 'No recent SIM changes',
        },
      };
    } catch (error) {
      logger.error('Recent SIM changes assessment error:', error);
      return this.createErrorFactor('Recent SIM Changes', RISK_WEIGHTS.RECENT_SIM_CHANGES);
    }
  }

  /**
   * Factor 9: Assess Port-Out Activity
   */
  private async assessPortOutActivity(input: RiskAssessmentInput): Promise<RiskFactorResult> {
    try {
      // Check for port-out requests (placeholder - would integrate with carrier API)
      // For now, simulate based on swap request patterns
      
      const recentRequests = await SimSwapRequest.find({
        userId: input.userId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      })
        .select('currentPhoneNumber newPhoneNumber')
        .limit(5)
        .lean();

      let score = 0;
      let portOutAttempts = 0;

      // Check if phone numbers are changing to different carriers (simplified check)
      // In production, this would query carrier database
      if (recentRequests.length > 0) {
        portOutAttempts = recentRequests.length;
        score = Math.min(portOutAttempts * 40, 100);
      }

      return {
        factorName: 'Port-Out Activity',
        weight: RISK_WEIGHTS.PORT_OUT_ACTIVITY,
        score,
        weightedScore: (score * RISK_WEIGHTS.PORT_OUT_ACTIVITY) / 100,
        status: score < 40 ? 'pass' : score < 70 ? 'warning' : 'fail',
        details: {
          portOutAttempts,
          message: portOutAttempts > 0
            ? `${portOutAttempts} potential port-out attempt(s) detected`
            : 'No port-out activity detected',
        },
      };
    } catch (error) {
      logger.error('Port-out activity assessment error:', error);
      return this.createErrorFactor('Port-Out Activity', RISK_WEIGHTS.PORT_OUT_ACTIVITY);
    }
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): RiskLevel {
    if (score >= 100) return RiskLevel.CRITICAL;
    if (score >= 71) return RiskLevel.HIGH;
    if (score >= 31) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  /**
   * Make final decision based on score and block reasons
   */
  private makeDecision(score: number, blockReasons: string[]): DecisionType {
    // Immediate block if there are critical block reasons
    if (blockReasons.length > 0) {
      return DecisionType.BLOCKED;
    }

    // Score-based decision
    if (score >= 90) {
      return DecisionType.REJECTED; // Auto-deny
    } else if (score >= 30) {
      return DecisionType.PENDING_REVIEW; // Manual review required
    } else {
      return DecisionType.APPROVED; // Auto-approve
    }
  }

  /**
   * Save risk assessment log
   */
  private async saveRiskLog(data: {
    userId: string;
    swapRequestId?: string;
    riskScore: number;
    riskLevel: RiskLevel;
    decision: DecisionType;
    factors: RiskFactorResult[];
    ipAddress: string;
  }): Promise<void> {
    try {
      const riskLog = new RiskLog({
        userId: data.userId,
        swapRequestId: data.swapRequestId,
        riskScore: data.riskScore,
        riskLevel: data.riskLevel,
        decision: data.decision,
        factors: data.factors.map(f => ({
          name: f.factorName,
          weight: f.weight,
          score: f.score,
          weightedScore: f.weightedScore,
          status: f.status,
          details: f.details,
        })),
        ipAddress: data.ipAddress,
        assessmentDate: new Date(),
      });

      await riskLog.save();
    } catch (error) {
      logger.error('Failed to save risk log:', error);
    }
  }

  /**
   * Create error factor result
   */
  private createErrorFactor(factorName: string, weight: number): RiskFactorResult {
    return {
      factorName,
      weight,
      score: 50, // Medium risk on error
      weightedScore: (50 * weight) / 100,
      status: 'warning',
      details: {
        error: true,
        message: 'Error assessing this factor',
      },
    };
  }
}

export default RiskScoringService;
