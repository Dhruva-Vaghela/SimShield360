import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import riskController from '../controllers/risk.controller';
import {
  getRiskLogsSchema,
  getRiskAnalyticsSchema,
  simulateRiskSchema,
} from '../validators/risk.validator';

const router = Router();

/**
 * @route   GET /api/v1/risk/requests/:id
 * @desc    Assess risk for a specific swap request
 * @access  Private (Agent/Admin)
 */
router.get(
  '/requests/:id',
  authenticate,
  requireRole('agent', 'admin'),
  riskController.assessRisk
);

/**
 * @route   GET /api/v1/risk/logs
 * @desc    Get risk assessment logs
 * @access  Private (Agent/Admin for all, Customer for own)
 */
router.get(
  '/logs',
  authenticate,
  validate(getRiskLogsSchema),
  riskController.getRiskLogs
);

/**
 * @route   GET /api/v1/risk/analytics
 * @desc    Get risk analytics and statistics
 * @access  Private (Agent/Admin)
 */
router.get(
  '/analytics',
  authenticate,
  requireRole('agent', 'admin'),
  validate(getRiskAnalyticsSchema),
  riskController.getRiskAnalytics
);

/**
 * @route   GET /api/v1/risk/factors/:requestId
 * @desc    Get detailed risk factors for a specific request
 * @access  Private (Agent/Admin)
 */
router.get(
  '/factors/:requestId',
  authenticate,
  requireRole('agent', 'admin'),
  riskController.getRiskFactors
);

/**
 * @route   POST /api/v1/risk/simulate
 * @desc    Simulate risk assessment (for testing)
 * @access  Private (Admin only)
 */
router.post(
  '/simulate',
  authenticate,
  requireRole('admin'),
  validate(simulateRiskSchema),
  riskController.simulateRiskAssessment
);

/**
 * @route   GET /api/v1/risk/explanation/:requestId
 * @desc    Get decision explanation for a request
 * @access  Private
 */
router.get(
  '/explanation/:requestId',
  authenticate,
  riskController.getDecisionExplanation
);

export default router;
