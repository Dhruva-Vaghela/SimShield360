import { SimLock } from '../../models/SimLock.model';
import logger from '../../utils/logger.util';

export interface CreateSimLockData {
  userId: string;
  phoneNumber: string;
  simCardNumber: string;
  reason?: string;
  initiatedBy: 'user' | 'system' | 'admin';
}

export interface SimLockResult {
  success: boolean;
  simLock?: any;
  simLocks?: any[];
  simLockId?: string;
  status?: string;
  isLocked?: boolean;
  lastModified?: Date;
  history?: any[];
  errorMessage?: string;
}

export class SimLockService {
  /**
   * Get all SIM locks for a user
   */
  async getUserSimLocks(userId: string): Promise<SimLockResult> {
    try {
      const simLocks = await SimLock.find({ userId })
        .sort({ createdAt: -1 })
        .lean();

      return {
        success: true,
        simLocks,
      };
    } catch (error) {
      logger.error('Get user SIM locks error:', error);
      return {
        success: false,
        errorMessage: 'Failed to retrieve SIM locks',
      };
    }
  }

  /**
   * Get SIM lock by ID
   */
  async getSimLockById(simLockId: string, userId: string): Promise<SimLockResult> {
    try {
      const simLock = await SimLock.findOne({ _id: simLockId, userId }).lean();

      if (!simLock) {
        return {
          success: false,
          errorMessage: 'SIM lock not found',
        };
      }

      return {
        success: true,
        simLock,
      };
    } catch (error) {
      logger.error('Get SIM lock by ID error:', error);
      return {
        success: false,
        errorMessage: 'Failed to retrieve SIM lock',
      };
    }
  }

  /**
   * Create new SIM lock
   */
  async createSimLock(data: CreateSimLockData): Promise<SimLockResult> {
    try {
      // Check if SIM lock already exists for this phone number
      const existingLock = await SimLock.findOne({
        userId: data.userId,
        phoneNumber: data.phoneNumber,
      });

      if (existingLock) {
        return {
          success: false,
          errorMessage: 'SIM lock already exists for this phone number',
        };
      }

      // Create SIM lock
      const simLock = new SimLock({
        userId: data.userId,
        phoneNumber: data.phoneNumber,
        simCardNumber: data.simCardNumber,
        status: 'locked',
        isLocked: true,
        initiatedBy: data.initiatedBy,
        history: [
          {
            action: 'created',
            status: 'locked',
            reason: data.reason || 'Initial lock',
            timestamp: new Date(),
            initiatedBy: data.initiatedBy,
          },
        ],
      });

      await simLock.save();

      logger.info('SIM lock created', {
        simLockId: simLock._id,
        userId: data.userId,
        phoneNumber: data.phoneNumber,
      });

      return {
        success: true,
        simLockId: simLock._id.toString(),
        simLock: simLock.toObject(),
      };
    } catch (error) {
      logger.error('Create SIM lock error:', error);
      return {
        success: false,
        errorMessage: 'Failed to create SIM lock',
      };
    }
  }

  /**
   * Enable SIM lock
   */
  async enableSimLock(simLockId: string, userId: string, reason?: string): Promise<SimLockResult> {
    try {
      const simLock = await SimLock.findOne({ _id: simLockId, userId });

      if (!simLock) {
        return {
          success: false,
          errorMessage: 'SIM lock not found',
        };
      }

      if (simLock.isLocked) {
        return {
          success: false,
          errorMessage: 'SIM lock is already enabled',
        };
      }

      // Update SIM lock
      simLock.isLocked = true;
      simLock.lockedAt = new Date();

      await simLock.save();

      logger.info('SIM lock enabled', {
        simLockId: simLock._id,
        userId,
      });

      return {
        success: true,
        simLock: simLock.toObject(),
      };
    } catch (error) {
      logger.error('Enable SIM lock error:', error);
      return {
        success: false,
        errorMessage: 'Failed to enable SIM lock',
      };
    }
  }

  /**
   * Disable SIM lock
   */
  async disableSimLock(simLockId: string, userId: string, reason?: string): Promise<SimLockResult> {
    try {
      const simLock = await SimLock.findOne({ _id: simLockId, userId });

      if (!simLock) {
        return {
          success: false,
          errorMessage: 'SIM lock not found',
        };
      }

      if (!simLock.isLocked) {
        return {
          success: false,
          errorMessage: 'SIM lock is already disabled',
        };
      }

      // Update SIM lock
      simLock.isLocked = false;
      simLock.unlockedAt = new Date();

      await simLock.save();

      logger.info('SIM lock disabled', {
        simLockId: simLock._id,
        userId,
      });

      return {
        success: true,
        simLock: simLock.toObject(),
      };
    } catch (error) {
      logger.error('Disable SIM lock error:', error);
      return {
        success: false,
        errorMessage: 'Failed to disable SIM lock',
      };
    }
  }

  /**
   * Get SIM lock status
   */
  async getSimLockStatus(simLockId: string, userId: string): Promise<SimLockResult> {
    try {
      const simLock = await SimLock.findOne({ _id: simLockId, userId }).lean();

      if (!simLock) {
        return {
          success: false,
          errorMessage: 'SIM lock not found',
        };
      }

      return {
        success: true,
        status: simLock.isLocked ? 'locked' : 'unlocked',
        isLocked: simLock.isLocked,
        lastModified: simLock.updatedAt,
      };
    } catch (error) {
      logger.error('Get SIM lock status error:', error);
      return {
        success: false,
        errorMessage: 'Failed to retrieve SIM lock status',
      };
    }
  }

  /**
   * Get SIM lock history
   */
  async getSimLockHistory(simLockId: string, userId: string): Promise<SimLockResult> {
    try {
      const simLock = await SimLock.findOne({ _id: simLockId, userId })
        .select('history')
        .lean();

      if (!simLock) {
        return {
          success: false,
          errorMessage: 'SIM lock not found',
        };
      }

      return {
        success: true,
        history: [],
      };
    } catch (error) {
      logger.error('Get SIM lock history error:', error);
      return {
        success: false,
        errorMessage: 'Failed to retrieve SIM lock history',
      };
    }
  }

  /**
   * Check if phone number is locked
   */
  async isPhoneNumberLocked(userId: string, phoneNumber: string): Promise<boolean> {
    try {
      const simLock = await SimLock.findOne({
        userId,
        phoneNumber,
        isLocked: true,
      });

      return !!simLock;
    } catch (error) {
      logger.error('Check phone number locked error:', error);
      return false;
    }
  }
}

export default SimLockService;
