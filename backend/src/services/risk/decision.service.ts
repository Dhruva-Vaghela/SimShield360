import logger from '../../utils/logger.util';
import { DecisionType, RiskLevel } from './scoring.service';

/**
 * Decision Thresholds
 */
export const DECISION_THRESHOLDS = {
  AUTO_APPROVE_MAX: 30,      // Risk score 0-30 = Auto-approve
  MANUAL_REVIEW_MIN: 30,     // Risk score 30-89 = Manual review
  MANUAL_REVIEW_MAX: 89,
  AUTO_DENY_MIN: 90,         // Risk score 90-100 = Auto-deny
  CRITICAL_BLOCK: 100,       // Risk score 100 = Immediate block
} as const;

/**
 * Decision Result Interface
 */
export interface DecisionResult {
  decision: DecisionType;
  reason: string;
  confidence: number;      // 0-100 (how confident the decision is)
  requiresReview: boolean;
  recommendedAction: string;
  escalationLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  additionalChecks?: string[];
}

/**
 * Decision Context Interface
 */
export interface DecisionContext {
  riskScore: number;
  riskLevel: RiskLevel;
  blockReasons?: string[];
  factors?: Array<{
    factorName: string;
    score: number;
    status: string;
  }>;
  userId?: string;
  swapRequestId?: string;
}

/**
 * Decision Engine Service - Central Decision-Making Brain
 */
export class DecisionService {
  /**
   * Make final decision based on risk assessment
   * NOTE: Risk Engine NEVER auto-approves. It only provides:
   * - Risk Score, Risk Level, Recommendation
   * - Final decision is ALWAYS made by the Telecom Agent
   */
  async makeDecision(
    riskScore: number,
    context?: Partial<DecisionContext>
  ): Promise<DecisionResult> {
    try {
      logger.info('Making decision', {
        riskScore,
        userId: context?.userId,
        swapRequestId: context?.swapRequestId,
      });

      // Immediate block - SIM Lock or critical violations
      if (context?.blockReasons && context.blockReasons.length > 0) {
        return this.createBlockDecision(context.blockReasons);
      }

      // Critical risk (100) - Immediate block
      if (riskScore >= DECISION_THRESHOLDS.CRITICAL_BLOCK) {
        return this.createCriticalBlockDecision();
      }

      // High risk (90-100) - Auto-deny (no agent needed)
      if (riskScore >= DECISION_THRESHOLDS.AUTO_DENY_MIN) {
        return this.createAutoDenyDecision(riskScore);
      }

      // ALL other scores (0-89): Route to agent for manual decision
      // Risk engine provides recommendation only — agent makes final call
      return this.createManualReviewDecision(riskScore);
    } catch (error) {
      logger.error('Decision making error:', error);
      return {
        decision: DecisionType.PENDING_REVIEW,
        reason: 'Error occurred during decision process - requires manual review',
        confidence: 0,
        requiresReview: true,
        recommendedAction: 'Manual review required due to system error',
        escalationLevel: 'high',
      };
    }
  }

  /**
   * Make decision with full context
   */
  async makeContextualDecision(context: DecisionContext): Promise<DecisionResult> {
    const baseDecision = await this.makeDecision(context.riskScore, context);

    // Enhance decision with factor analysis
    if (context.factors) {
      const criticalFactors = context.factors.filter(
        f => f.status === 'fail' && f.score > 70
      );

      if (criticalFactors.length > 0) {
        baseDecision.additionalChecks = criticalFactors.map(
          f => `Critical: ${f.factorName} requires attention`
        );
      }
    }

    return baseDecision;
  }

  /**
   * Create auto-approve decision
   */
  private createAutoApproveDecision(riskScore: number): DecisionResult {
    const confidence = 100 - riskScore; // Lower risk = higher confidence

    return {
      decision: DecisionType.APPROVED,
      reason: `Low risk score (${riskScore}) - Auto-approved`,
      confidence,
      requiresReview: false,
      recommendedAction: 'Approve swap request automatically',
      escalationLevel: 'none',
    };
  }

  /**
   * Create manual review decision
   */
  private createManualReviewDecision(riskScore: number): DecisionResult {
    let escalationLevel: 'medium' | 'high' = 'medium';
    let additionalChecks: string[] = [];

    // Higher risk within manual review range = higher escalation
    if (riskScore >= 70) {
      escalationLevel = 'high';
      additionalChecks = [
        'Verify user identity through additional channels',
        'Contact customer via registered phone/email',
        'Review recent account activity',
      ];
    } else if (riskScore >= 50) {
      additionalChecks = [
        'Review risk factors',
        'Verify primary authentication details',
      ];
    }

    const confidence = 50; // Medium confidence for manual review

    return {
      decision: DecisionType.PENDING_REVIEW,
      reason: `Medium risk score (${riskScore}) - Manual review required`,
      confidence,
      requiresReview: true,
      recommendedAction: 'Route to agent for manual verification',
      escalationLevel,
      additionalChecks,
    };
  }

  /**
   * Create auto-deny decision
   */
  private createAutoDenyDecision(riskScore: number): DecisionResult {
    const confidence = riskScore - 50; // Higher risk = higher confidence in denial

    return {
      decision: DecisionType.REJECTED,
      reason: `High risk score (${riskScore}) - Auto-denied`,
      confidence,
      requiresReview: false,
      recommendedAction: 'Deny swap request and notify user',
      escalationLevel: 'high',
      additionalChecks: [
        'Notify user of denial',
        'Suggest identity verification steps',
        'Monitor for additional attempts',
      ],
    };
  }

  /**
   * Create block decision (for critical violations)
   */
  private createBlockDecision(blockReasons: string[]): DecisionResult {
    return {
      decision: DecisionType.BLOCKED,
      reason: `Request blocked: ${blockReasons.join('; ')}`,
      confidence: 100,
      requiresReview: false,
      recommendedAction: 'Block request immediately - Critical security violation',
      escalationLevel: 'critical',
      additionalChecks: [
        'Log security incident',
        'Alert security team',
        'Consider account freeze',
      ],
    };
  }

  /**
   * Create critical block decision (100 risk score)
   */
  private createCriticalBlockDecision(): DecisionResult {
    return {
      decision: DecisionType.BLOCKED,
      reason: 'Critical risk level detected - Immediate block',
      confidence: 100,
      requiresReview: false,
      recommendedAction: 'Block immediately and escalate to security team',
      escalationLevel: 'critical',
      additionalChecks: [
        'Freeze account immediately',
        'Alert fraud prevention team',
        'Initiate security investigation',
        'Contact user through verified channels',
      ],
    };
  }

  /**
   * Evaluate if decision can be overridden by agent
   */
  canOverride(decision: DecisionType, agentRole: string): boolean {
    // Admin can override any decision
    if (agentRole === 'admin') {
      return true;
    }

    // Agent can override pending_review and rejected
    if (agentRole === 'agent') {
      return decision === DecisionType.PENDING_REVIEW || 
             decision === DecisionType.REJECTED;
    }

    // Customer cannot override
    return false;
  }

  /**
   * Get escalation path for decision
   */
  getEscalationPath(escalationLevel: string): string[] {
    const escalationPaths: Record<string, string[]> = {
      none: [],
      low: ['Tier 1 Support'],
      medium: ['Tier 1 Support', 'Tier 2 Agent'],
      high: ['Tier 2 Agent', 'Senior Agent', 'Supervisor'],
      critical: ['Security Team', 'Fraud Prevention Team', 'Senior Management'],
    };

    return escalationPaths[escalationLevel] || [];
  }

  /**
   * Calculate decision confidence adjustment based on context
   */
  adjustConfidenceBasedOnHistory(
    baseConfidence: number,
    userHistory: {
      previousApprovals: number;
      previousDenials: number;
      accountAge: number; // in days
    }
  ): number {
    let adjustedConfidence = baseConfidence;

    // Boost confidence for users with good history
    if (userHistory.previousApprovals > 5 && userHistory.previousDenials === 0) {
      adjustedConfidence += 10;
    }

    // Reduce confidence for users with denials
    if (userHistory.previousDenials > 0) {
      adjustedConfidence -= userHistory.previousDenials * 5;
    }

    // Boost confidence for older accounts
    if (userHistory.accountAge > 365) {
      adjustedConfidence += 5;
    } else if (userHistory.accountAge < 30) {
      adjustedConfidence -= 10;
    }

    return Math.max(0, Math.min(100, adjustedConfidence));
  }
}

export default DecisionService;
