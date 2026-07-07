import { Request, Response, NextFunction } from 'express';
import { AttackLog } from '../models/AttackLog.model';
import { SimSwapRequest } from '../models/SimSwapRequest.model';
import { User } from '../models/User.model';
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
 * Get all attack logs (includes both simulated attacks and real customer requests)
 */
export const getAttackLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const logs = await AttackLog.find().sort({ timestamp: -1 }).limit(50).lean().exec();

    // Fetch SimSwapRequests and populate User model for customer profile name
    const swapRequests = await SimSwapRequest.find()
      .populate({ path: 'userId', model: User })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();

    // Map SimSwapRequests into the AttackLog structure
    const mappedSwaps = swapRequests.map((sr: any) => {
      const user = sr.userId;
      const firstName = user?.profile?.firstName || 'Customer';
      const lastName = user?.profile?.lastName || '';
      const targetCustomer = `${firstName} ${lastName}`.trim();

      // Map backend SimSwapRequest status to client-friendly/AttackLog status
      let status = 'started';
      if (sr.status === 'approved') status = 'succeeded';
      else if (sr.status === 'rejected' || sr.status === 'denied') status = 'rejected';
      else if (sr.status === 'blocked') status = 'blocked';
      else if (sr.status === 'pending_review' || sr.status === 'processing') status = 'waiting';

      // Build simulated workflow logs based on layer results
      const logs = (sr.layerResults || []).map((lr: any) => ({
        timestamp: lr.timestamp || new Date(),
        type: lr.passed ? 'success' as const : 'error' as const,
        message: `${lr.name}: ${lr.details?.message || (lr.passed ? 'Passed' : 'Failed')}`,
      }));

      if (logs.length === 0) {
        logs.push({
          timestamp: sr.createdAt,
          type: 'info' as const,
          message: `SIM Swap request submitted by customer: ${targetCustomer}`,
        });
      }

      return {
        _id: sr._id,
        requestId: sr._id.toString(), // The frontend expects the MongoDB hex id to manage approval/rejection properly
        targetCustomer,
        customerNumber: sr.currentPhoneNumber,
        attackType: sr.requestType || 'sim_swap',
        location: sr.location?.country || 'Vadodara',
        device: "Rahul's iPhone", // default fallback
        network: 'carrier',
        fakeDocuments: false,
        multipleAttempts: false,
        status,
        currentLayer: 'None',
        riskScore: sr.riskScore || 12,
        logs,
        timestamp: sr.createdAt || new Date(),
        createdAt: sr.createdAt || new Date(),
        updatedAt: sr.updatedAt || new Date(),
      };
    });

    // Merge simulated and real requests and sort by timestamp
    const allLogs = [...logs, ...mappedSwaps].sort((a: any, b: any) => {
      const timeA = new Date(a.timestamp || a.createdAt).getTime();
      const timeB = new Date(b.timestamp || b.createdAt).getTime();
      return timeB - timeA;
    });

    res.status(200).json({
      success: true,
      data: allLogs.slice(0, 50),
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
