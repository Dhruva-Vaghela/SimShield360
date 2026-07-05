import { Request, Response, NextFunction } from 'express';
import { AttackLog } from '../models/AttackLog.model';
import logger from '../utils/logger.util';

/**
 * Create a new attack simulation record
 */
export const createAttack = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      requestId,
      targetCustomer,
      customerNumber,
      attackType,
      location,
      device,
      network,
      fakeDocuments,
      multipleAttempts,
      riskScore,
    } = req.body;

    const attack = await AttackLog.create({
      requestId,
      targetCustomer,
      customerNumber,
      attackType,
      location,
      device,
      network,
      fakeDocuments,
      multipleAttempts,
      riskScore,
      status: 'started',
      currentLayer: 'None',
      logs: [
        {
          type: 'info',
          message: `Attack simulation initialized: ${attackType} on ${targetCustomer}`,
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: attack,
    });
  } catch (error) {
    logger.error('Failed to create attack log:', error);
    next(error);
  }
};

/**
 * Update an attack simulation record status, logs, or metrics
 */
export const updateAttack = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, currentLayer, riskScore, detectionStatus, logMessage, logType } = req.body;

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (currentLayer) updateFields.currentLayer = currentLayer;
    if (riskScore !== undefined) updateFields.riskScore = riskScore;
    if (detectionStatus !== undefined) updateFields.detectionStatus = detectionStatus;

    const updateQuery: any = { $set: updateFields };

    if (logMessage) {
      updateQuery.$push = {
        logs: {
          type: logType || 'info',
          message: logMessage,
          timestamp: new Date(),
        },
      };
    }

    const attack = await AttackLog.findOneAndUpdate({ requestId: id }, updateQuery, {
      new: true,
      runValidators: true,
    });

    if (!attack) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Attack simulation record not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: attack,
    });
  } catch (error) {
    logger.error('Failed to update attack log:', error);
    next(error);
  }
};

/**
 * Get all attack logs
 */
export const getAttackLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const logs = await AttackLog.find().sort({ timestamp: -1 }).limit(50).exec();
    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    logger.error('Failed to retrieve attack logs:', error);
    next(error);
  }
};

export default {
  createAttack,
  updateAttack,
  getAttackLogs,
};
