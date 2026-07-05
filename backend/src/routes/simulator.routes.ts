import { Router } from 'express';
import simulatorController from '../controllers/simulator.controller';

const router = Router();

/**
 * @route   POST /api/v1/simulator/attacks
 * @desc    Create a new simulated attack record
 * @access  Public
 */
router.post('/attacks', simulatorController.createAttack);

/**
 * @route   PUT /api/v1/simulator/attacks/:id
 * @desc    Update simulated attack status or add logs
 * @access  Public
 */
router.put('/attacks/:id', simulatorController.updateAttack);

/**
 * @route   GET /api/v1/simulator/attacks
 * @desc    Get simulation logs history
 * @access  Public
 */
router.get('/attacks', simulatorController.getAttackLogs);

export default router;
