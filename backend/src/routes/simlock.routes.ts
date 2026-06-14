import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import simlockController from '../controllers/simlock.controller';
import {
  createSimLockSchema,
  updateSimLockStatusSchema,
} from '../validators/simlock.validator';

const router = Router();

/**
 * @route   GET /api/v1/simlocks
 * @desc    Get all SIM locks for authenticated user
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  simlockController.getSimLocks
);

/**
 * @route   GET /api/v1/simlocks/:id
 * @desc    Get SIM lock by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  simlockController.getSimLockById
);

/**
 * @route   POST /api/v1/simlocks
 * @desc    Create new SIM lock
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate(createSimLockSchema),
  simlockController.createSimLock
);

/**
 * @route   PUT /api/v1/simlocks/:id/lock
 * @desc    Enable SIM lock
 * @access  Private
 */
router.put(
  '/:id/lock',
  authenticate,
  validate(updateSimLockStatusSchema),
  simlockController.enableSimLock
);

/**
 * @route   PUT /api/v1/simlocks/:id/unlock
 * @desc    Disable SIM lock
 * @access  Private
 */
router.put(
  '/:id/unlock',
  authenticate,
  validate(updateSimLockStatusSchema),
  simlockController.disableSimLock
);

/**
 * @route   GET /api/v1/simlocks/:id/status
 * @desc    Get SIM lock status
 * @access  Private
 */
router.get(
  '/:id/status',
  authenticate,
  simlockController.getSimLockStatus
);

/**
 * @route   GET /api/v1/simlocks/:id/history
 * @desc    Get SIM lock history
 * @access  Private
 */
router.get(
  '/:id/history',
  authenticate,
  simlockController.getSimLockHistory
);

export default router;
