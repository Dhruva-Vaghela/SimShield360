import { Response, NextFunction } from 'express';
import { AuthenticateRequest } from '../middleware/auth.middleware';
import { response } from '../utils/response.util';
import { RiskScoringService, RiskAssessmentInput } from '../services/risk/scoring.service';
import { DecisionService } from '../services/risk/decision.service';
import { RiskLog } from '../models/RiskLog.model';
import { SimSwapRequest } from '../models/SimSwapRequest.model';
import logger from '../utils/logger.util';

const riskScoringService = new RiskScoringService();
const decisionService = new DecisionService();

/**
 * Assess risk for a swap request
 */
export const assessRisk = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params; // Swap request ID

    // Get swap request
    const swapRequest = await SimSwapRequest.findById(id);

    if (!swapRequest) {
      response.notFound(res, 'Swap Request', id);
      return;
    }

    // Prepare risk assessment input
    const input: RiskAssessmentInput = {
      userId: swapRequest.userId.toString(),
      swapRequestId: id,
      phoneNumber: swapRequest.currentPhoneNumber,
      newPhoneNumber: swapRequest.newPhoneNumber,
      deviceFingerprint: swapRequest.deviceFingerprint,
      ipAddress: swapRequest.ipAddress,
      userAgent: swapRequest.userAgent,
    };

    // Calculate risk score
    const assessment = await riskScoringService.calculateRiskScore(input);

    response.success(res, assessment);
  } catch (error) {
    logger.error('Risk assessment error:', error);
    response.internalError(res);
  }
};

/**
 * Get risk logs with filters
 */
export const getRiskLogs = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userRole = req.user!.role;
    const userId = req.user!.id;
    const { page = '1', limit = '20', riskLevel, decision } = req.query;

    const filter: any = {};

    // Customers can only see their own logs
    if (userRole === 'customer') {
      filter.userId = userId;
    }

    if (riskLevel) filter.riskLevel = riskLevel;
    if (decision) filter.decision = decision;

    const total = await RiskLog.countDocuments(filter);
    const logs = await RiskLog.find(filter)
      .sort({ assessmentDate: -1 })
      .skip((parseInt(page as string, 10) - 1) * parseInt(limit as string, 10))
      .limit(parseInt(limit as string, 10))
      .populate('userId', 'email profile.firstName profile.lastName')
      .populate('swapRequestId', 'currentPhoneNumber newPhoneNumber status')
      .lean();

    response.successWithPagination(res, logs, {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit as string, 10)),
    });
  } catch (error) {
    logger.error('Get risk logs error:', error);
    response.internalError(res);
  }
};

/**
 * Get risk analytics
 */
export const getRiskAnalytics = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const filter: any = {};
    if (Object.keys(dateFilter).length > 0) {
      filter.assessmentDate = dateFilter;
    }

    // Get statistics
    const [
      totalAssessments,
      riskLevelDistribution,
      decisionDistribution,
      averageRiskScore,
      highRiskCount,
    ] = await Promise.all([
      RiskLog.countDocuments(filter),
      
      RiskLog.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$riskLevel',
            count: { $sum: 1 },
          },
        },
      ]),
      
      RiskLog.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$decision',
            count: { $sum: 1 },
          },
        },
      ]),
      
      RiskLog.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$riskScore' },
          },
        },
      ]),
      
      RiskLog.countDocuments({ ...filter, riskLevel: 'high' }),
    ]);

    // Get top risk factors
    const topRiskFactors = await RiskLog.aggregate([
      { $match: filter },
      { $unwind: '$factors' },
      {
        $group: {
          _id: '$factors.name',
          avgScore: { $avg: '$factors.score' },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgScore: -1 } },
      { $limit: 10 },
    ]);

    // Get trend data (daily)
    const trendData = await RiskLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$assessmentDate' },
          },
          count: { $sum: 1 },
          avgRiskScore: { $avg: '$riskScore' },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$decision', 'approved'] }, 1, 0] },
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ['$decision', 'rejected'] }, 1, 0] },
          },
          blockedCount: {
            $sum: { $cond: [{ $eq: ['$decision', 'blocked'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    const analytics = {
      summary: {
        totalAssessments,
        averageRiskScore: averageRiskScore[0]?.avgScore || 0,
        highRiskCount,
        highRiskPercentage: totalAssessments > 0
          ? (highRiskCount / totalAssessments) * 100
          : 0,
      },
      distribution: {
        riskLevel: riskLevelDistribution.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        decision: decisionDistribution.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
      topRiskFactors: topRiskFactors.map((f: any) => ({
        factor: f._id,
        averageScore: Math.round(f.avgScore * 10) / 10,
        occurrences: f.count,
      })),
      trends: trendData.map((t: any) => ({
        date: t._id,
        totalAssessments: t.count,
        averageRiskScore: Math.round(t.avgRiskScore * 10) / 10,
        approved: t.approvedCount,
        rejected: t.rejectedCount,
        blocked: t.blockedCount,
      })),
    };

    response.success(res, analytics);
  } catch (error) {
    logger.error('Get risk analytics error:', error);
    response.internalError(res);
  }
};

/**
 * Get risk factors for a specific request
 */
export const getRiskFactors = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { requestId } = req.params;

    const riskLog = await RiskLog.findOne({ swapRequestId: requestId })
      .sort({ assessmentDate: -1 })
      .lean();

    if (!riskLog) {
      response.notFound(res, 'Risk Assessment', requestId);
      return;
    }

    // Calculate factor insights
    const factorInsights = riskLog.factors.map((factor: any) => ({
      name: factor.name,
      weight: factor.weight,
      score: factor.score,
      weightedScore: factor.weightedScore,
      status: factor.status,
      impact: factor.weightedScore > 15 ? 'high' : factor.weightedScore > 5 ? 'medium' : 'low',
      details: factor.details,
    }));

    // Sort by weighted score (highest impact first)
    factorInsights.sort((a, b) => b.weightedScore - a.weightedScore);

    const result = {
      swapRequestId: requestId,
      assessmentDate: riskLog.assessmentDate,
      riskScore: riskLog.riskScore,
      riskLevel: riskLog.riskLevel,
      decision: riskLog.decision,
      factors: factorInsights,
      summary: {
        totalFactors: factorInsights.length,
        highImpactFactors: factorInsights.filter(f => f.impact === 'high').length,
        failedFactors: factorInsights.filter(f => f.status === 'fail').length,
        topContributor: factorInsights[0]?.name,
      },
    };

    response.success(res, result);
  } catch (error) {
    logger.error('Get risk factors error:', error);
    response.internalError(res);
  }
};

/**
 * Simulate risk assessment (for testing)
 */
export const simulateRiskAssessment = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const input: RiskAssessmentInput = {
      userId: req.user!.id,
      phoneNumber: req.body.phoneNumber,
      newPhoneNumber: req.body.newPhoneNumber,
      deviceFingerprint: req.body.deviceFingerprint,
      ipAddress: req.ip || '',
      simLockStatus: req.body.simLockStatus,
      faceVerificationScore: req.body.faceVerificationScore,
      authenticatorVerified: req.body.authenticatorVerified,
      trustedDevice: req.body.trustedDevice,
    };

    const assessment = await riskScoringService.calculateRiskScore(input);

    response.success(res, assessment);
  } catch (error) {
    logger.error('Simulate risk assessment error:', error);
    response.internalError(res);
  }
};

/**
 * Get decision explanation
 */
export const getDecisionExplanation = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { requestId } = req.params;

    const riskLog = await RiskLog.findOne({ swapRequestId: requestId })
      .sort({ assessmentDate: -1 })
      .lean();

    if (!riskLog) {
      response.notFound(res, 'Risk Assessment', requestId);
      return;
    }

    const decisionResult = await decisionService.makeContextualDecision({
      riskScore: riskLog.riskScore,
      riskLevel: riskLog.riskLevel as any,
      factors: riskLog.factors.map((f: any) => ({
        factorName: f.name,
        score: f.score,
        status: f.status,
      })),
      userId: riskLog.userId.toString(),
      swapRequestId: requestId,
    });

    const explanation = {
      decision: riskLog.decision,
      riskScore: riskLog.riskScore,
      riskLevel: riskLog.riskLevel,
      reason: decisionResult.reason,
      confidence: decisionResult.confidence,
      escalationLevel: decisionResult.escalationLevel,
      recommendedAction: decisionResult.recommendedAction,
      additionalChecks: decisionResult.additionalChecks,
      escalationPath: decisionService.getEscalationPath(decisionResult.escalationLevel),
      keyFactors: riskLog.factors
        .filter((f: any) => f.weightedScore > 10)
        .map((f: any) => ({
          name: f.name,
          score: f.score,
          status: f.status,
        })),
    };

    response.success(res, explanation);
  } catch (error) {
    logger.error('Get decision explanation error:', error);
    response.internalError(res);
  }
};

export default {
  assessRisk,
  getRiskLogs,
  getRiskAnalytics,
  getRiskFactors,
  simulateRiskAssessment,
  getDecisionExplanation,
};
