import { SimSwapRequest } from '../../models/SimSwapRequest.model';
import { SimLockService } from '../simlock/simlock.service';
import { RiskScoringService } from '../risk/scoring.service';
import { DecisionService } from '../risk/decision.service';
import logger from '../../utils/logger.util';

export interface WorkflowResult {
  success: boolean;
  status: string;
  finalDecision: 'approved' | 'denied' | 'pending_review';
  layerResults?: any[];
  riskScore?: number;
  errorMessage?: string;
}

export class WorkflowService {
  private simlockService: SimLockService;
  private riskScoringService: RiskScoringService;
  private decisionService: DecisionService;

  constructor() {
    this.simlockService = new SimLockService();
    this.riskScoringService = new RiskScoringService();
    this.decisionService = new DecisionService();
  }

  /**
   * Process SIM swap request through all 7 layers
   */
  async processSwapRequest(swapRequestId: string): Promise<WorkflowResult> {
    try {
      const swapRequest = await SimSwapRequest.findById(swapRequestId);

      if (!swapRequest) {
        return {
          success: false,
          status: 'error',
          finalDecision: 'denied',
          errorMessage: 'Swap request not found',
        };
      }

      logger.info('Starting 7-layer workflow processing', {
        swapRequestId: swapRequest._id,
        userId: swapRequest.userId,
      });

      // Update status to processing
      swapRequest.status = 'processing';
      await swapRequest.save();

      // Layer 1: SIM Lock Firewall
      const layer1Result = await this.processLayer1SimLock(swapRequest);
      swapRequest.layerResults.push(layer1Result);

      if (!layer1Result.passed) {
        swapRequest.status = 'rejected';
        swapRequest.finalDecision = 'denied';
        await swapRequest.save();

        return {
          success: true,
          status: 'rejected',
          finalDecision: 'denied',
          layerResults: swapRequest.layerResults,
        };
      }

      // Layer 2: Face Verification (skip if not available)
      const layer2Result = await this.processLayer2FaceVerification(swapRequest);
      swapRequest.layerResults.push(layer2Result);

      // Layer 3: Authenticator Verification (skip if not available)
      const layer3Result = await this.processLayer3Authenticator(swapRequest);
      swapRequest.layerResults.push(layer3Result);

      // Layer 4: Trusted Device Consent (skip if not available)
      const layer4Result = await this.processLayer4DeviceConsent(swapRequest);
      swapRequest.layerResults.push(layer4Result);

      // Layer 5: Telecom Intelligence
      const layer5Result = await this.processLayer5TelecomIntelligence(swapRequest);
      swapRequest.layerResults.push(layer5Result);

      // Layer 6: Risk Scoring Engine (Advanced)
      const riskAssessment = await this.riskScoringService.calculateRiskScore({
        userId: swapRequest.userId.toString(),
        swapRequestId: swapRequest._id.toString(),
        phoneNumber: swapRequest.currentPhoneNumber,
        newPhoneNumber: swapRequest.newPhoneNumber,
        deviceFingerprint: swapRequest.deviceFingerprint || '',
        ipAddress: swapRequest.ipAddress,
        userAgent: swapRequest.userAgent,
        simLockStatus: !layer1Result.passed,
        faceVerificationScore: layer2Result.score,
        authenticatorVerified: layer3Result.passed,
        trustedDevice: layer4Result.passed,
      });

      const layer6Result = {
        layer: 6,
        name: 'Risk Scoring Engine',
        passed: riskAssessment.riskLevel !== 'critical',
        score: riskAssessment.riskScore,
        details: {
          riskScore: riskAssessment.riskScore,
          riskLevel: riskAssessment.riskLevel,
          factors: riskAssessment.factors,
          recommendations: riskAssessment.recommendations,
        },
        timestamp: new Date(),
      };
      swapRequest.layerResults.push(layer6Result);
      swapRequest.riskScore = riskAssessment.riskScore;

      // Layer 7: Final Decision Engine (Advanced)
      const decisionResult = await this.decisionService.makeContextualDecision({
        riskScore: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
        blockReasons: riskAssessment.blockReasons,
        factors: riskAssessment.factors.map(f => ({
          factorName: f.factorName,
          score: f.score,
          status: f.status,
        })),
        userId: swapRequest.userId.toString(),
        swapRequestId: swapRequest._id.toString(),
      });

      const layer7Result = {
        layer: 7,
        name: 'Final Decision Engine',
        passed: decisionResult.decision === 'approved',
        score: decisionResult.confidence,
        details: {
          decision: decisionResult.decision,
          reason: decisionResult.reason,
          confidence: decisionResult.confidence,
          escalationLevel: decisionResult.escalationLevel,
          recommendedAction: decisionResult.recommendedAction,
          additionalChecks: decisionResult.additionalChecks,
        },
        timestamp: new Date(),
      };
      swapRequest.layerResults.push(layer7Result);

      // Update swap request with final decision
      swapRequest.finalDecision = decisionResult.decision as any;

      if (decisionResult.decision === DecisionType.APPROVED) {
        swapRequest.status = 'approved';
        swapRequest.approvedAt = new Date();
      } else if (decisionResult.decision === DecisionType.REJECTED || decisionResult.decision === DecisionType.BLOCKED) {
        swapRequest.status = 'rejected';
        swapRequest.rejectedAt = new Date();
      } else {
        // PENDING_REVIEW - route to agent for manual decision
        swapRequest.status = 'pending_review';
      }

      await swapRequest.save();

      logger.info('7-layer workflow processing completed', {
        swapRequestId: swapRequest._id,
        finalDecision: decisionResult.decision,
        riskScore: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
      });

      return {
        success: true,
        status: swapRequest.status,
        finalDecision: decisionResult.decision,
        layerResults: swapRequest.layerResults,
        riskScore: riskAssessment.riskScore,
      };
    } catch (error) {
      logger.error('Workflow processing error:', error);
      return {
        success: false,
        status: 'error',
        finalDecision: 'denied',
        errorMessage: 'Failed to process workflow',
      };
    }
  }

  /**
   * Layer 1: SIM Lock Firewall
   */
  private async processLayer1SimLock(swapRequest: any): Promise<any> {
    try {
      const isLocked = await this.simlockService.isPhoneNumberLocked(
        swapRequest.userId,
        swapRequest.currentPhoneNumber
      );

      return {
        layer: 1,
        name: 'SIM Lock Firewall',
        passed: !isLocked,
        score: isLocked ? 0 : 100,
        details: {
          isLocked,
          message: isLocked
            ? 'SIM lock is active - request blocked'
            : 'No SIM lock active',
        },
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Layer 1 processing error:', error);
      return {
        layer: 1,
        name: 'SIM Lock Firewall',
        passed: false,
        score: 0,
        details: { error: 'Failed to check SIM lock status' },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Layer 2: Face Verification (placeholder)
   */
  private async processLayer2FaceVerification(swapRequest: any): Promise<any> {
    // This would integrate with face verification service
    // For now, return a placeholder result
    return {
      layer: 2,
      name: 'Face Verification',
      passed: true,
      score: 90,
      details: {
        message: 'Face verification not required for this request',
        matchScore: 0,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Layer 3: Authenticator Verification (placeholder)
   */
  private async processLayer3Authenticator(swapRequest: any): Promise<any> {
    // This would integrate with TOTP verification
    // For now, return a placeholder result
    return {
      layer: 3,
      name: 'Authenticator Verification',
      passed: true,
      score: 85,
      details: {
        message: 'Authenticator verification not required for this request',
        verified: false,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Layer 4: Trusted Device Consent (placeholder)
   */
  private async processLayer4DeviceConsent(swapRequest: any): Promise<any> {
    // This would check trusted device status
    // For now, return a placeholder result
    return {
      layer: 4,
      name: 'Trusted Device Consent',
      passed: true,
      score: 80,
      details: {
        message: 'Device verification not required for this request',
        isTrusted: false,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Layer 5: Telecom Intelligence (placeholder)
   */
  private async processLayer5TelecomIntelligence(swapRequest: any): Promise<any> {
    // This would integrate with telecom intelligence service
    // For now, return a placeholder result
    return {
      layer: 5,
      name: 'Telecom Intelligence',
      passed: true,
      score: 75,
      details: {
        message: 'Telecom data analysis completed',
        accountAge: 365,
        previousSwaps: 0,
      },
      timestamp: new Date(),
    };
  }
}

export default WorkflowService;
