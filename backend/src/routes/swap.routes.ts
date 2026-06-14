import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import { swapRequestRateLimiter } from '../middleware/rateLimit.middleware';
import swapController from '../controllers/swap.controller';
import {
  createSwapRequestSchema,
  approveSwapRequestSchema,
  rejectSwapRequestSchema,
} from '../validators/swap.validator';

const router = Router();

/**
 * @route   POST /api/v1/swap-requests
 * @desc    Create new SIM swap request
 * @access  Private (Customer)
 */
router.post(
  '/',
  authenticate,
  swapRequestRateLimiter,
  validate(createSwapRequestSchema),
  swapController.createSwapRequest
);

/**
 * @route   GET /api/v1/swap-requests
 * @desc    Get all swap requests (filtered by role)
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  swapController.getSwapRequests
);

/**
 * @route   GET /api/v1/swap-requests/:id
 * @desc    Get swap request by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  swapController.getSwapRequestById
);

/**
 * @route   PUT /api/v1/swap-requests/:id/cancel
 * @desc    Cancel swap request
 * @access  Private (Customer - own requests only)
 */
router.put(
  '/:id/cancel',
  authenticate,
  swapController.cancelSwapRequest
);

/**
 * @route   POST /api/v1/swap-requests/:id/approve
 * @desc    Approve swap request (manual review)
 * @access  Private (Agent/Admin)
 */
router.post(
  '/:id/approve',
  authenticate,
  requireRole('agent', 'admin'),
  validate(approveSwapRequestSchema),
  swapController.approveSwapRequest
);

/**
 * @route   POST /api/v1/swap-requests/:id/reject
 * @desc    Reject swap request (manual review)
 * @access  Private (Agent/Admin)
 */
router.post(
  '/:id/reject',
  authenticate,
  requireRole('agent', 'admin'),
  validate(rejectSwapRequestSchema),
  swapController.rejectSwapRequest
);

/**
 * @route   GET /api/v1/swap-requests/:id/workflow
 * @desc    Get swap request workflow status (all 7 layers)
 * @access  Private
 */
router.get(
  '/:id/workflow',
  authenticate,
  swapController.getWorkflowStatus
);

/**
 * @route   GET /api/v1/swap-requests/pending/review
 * @desc    Get all pending swap requests for manual review
 * @access  Private (Agent/Admin)
 */
router.get(
  '/pending/review',
  authenticate,
  requireRole('agent', 'admin'),
  swapController.getPendingReviewRequests
);

export default router;
