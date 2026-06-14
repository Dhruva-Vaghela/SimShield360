import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import deviceController from '../controllers/device.controller';
import {
  registerDeviceSchema,
  updateDeviceSchema,
} from '../validators/device.validator';

const router = Router();

/**
 * @route   GET /api/v1/devices
 * @desc    Get all trusted devices for authenticated user
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  deviceController.getTrustedDevices
);

/**
 * @route   GET /api/v1/devices/:id
 * @desc    Get trusted device by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  deviceController.getDeviceById
);

/**
 * @route   POST /api/v1/devices/register
 * @desc    Register a new trusted device
 * @access  Private
 */
router.post(
  '/register',
  authenticate,
  validate(registerDeviceSchema),
  deviceController.registerDevice
);

/**
 * @route   PUT /api/v1/devices/:id
 * @desc    Update device details (name, etc.)
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  validate(updateDeviceSchema),
  deviceController.updateDevice
);

/**
 * @route   DELETE /api/v1/devices/:id
 * @desc    Remove trusted device
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  deviceController.removeDevice
);

/**
 * @route   POST /api/v1/devices/:id/revoke
 * @desc    Revoke device trust status
 * @access  Private
 */
router.post(
  '/:id/revoke',
  authenticate,
  deviceController.revokeDeviceTrust
);

/**
 * @route   GET /api/v1/devices/current/fingerprint
 * @desc    Get current device fingerprint
 * @access  Private
 */
router.get(
  '/current/fingerprint',
  authenticate,
  deviceController.getCurrentDeviceFingerprint
);

export default router;
