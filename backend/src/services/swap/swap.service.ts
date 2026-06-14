import { SimSwapRequest, SwapRequestStatus } from '../../models/SimSwapRequest.model';
import logger from '../../utils/logger.util';

export interface CreateSwapRequestData {
  userId: string;
  currentPhoneNumber: string;
  newPhoneNumber: string;
  newSimCardNumber: string;
  reason: string;
  deviceFingerprint?: string;
  ipAddress: string;
  userAgent: string;
}

export interface GetSwapRequestsQuery {
  userId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface SwapServiceResult {
  success: boolean;
  swapRequest?: any;
  swapRequests?: any[];
  swapRequestId?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errorMessage?: string;
}

export class SwapService {
  /**
   * Create new SIM swap request
   */
  async createSwapRequest(data: CreateSwapRequestData): Promise<SwapServiceResult> {
    try {
      // Check for pending requests
      const pendingRequest = await SimSwapRequest.findOne({
        userId: data.userId,
        currentPhoneNumber: data.currentPhoneNumber,
        status: { $in: ['pending', 'processing', 'pending_review'] },
      });

      if (pendingRequest) {
        return {
          success: false,
          errorMessage: 'You already have a pending swap request for this number',
        };
      }

      // Create swap request
      const swapRequest = new SimSwapRequest({
        userId: data.userId,
        currentPhoneNumber: data.currentPhoneNumber,
        newPhoneNumber: data.newPhoneNumber,
        newSimCardNumber: data.newSimCardNumber,
        reason: data.reason,
        deviceFingerprint: data.deviceFingerprint,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        status: 'pending',
        layerResults: [],
      });

      await swapRequest.save();

      logger.info('Swap request created', {
        swapRequestId: swapRequest._id,
        userId: data.userId,
        currentPhoneNumber: data.currentPhoneNumber,
      });

      return {
        success: true,
        swapRequestId: swapRequest._id.toString(),
        swapRequest: swapRequest.toObject(),
      };
    } catch (error) {
      logger.error('Create swap request error:', error);
      return {
        success: false,
        errorMessage: 'Failed to create swap request',
      };
    }
  }

  /**
   * Get swap requests with filters
   */
  async getSwapRequests(query: GetSwapRequestsQuery): Promise<SwapServiceResult> {
    try {
      const { userId, status, page = 1, limit = 10 } = query;

      const filter: any = {};
      if (userId) filter.userId = userId;
      if (status) filter.status = status;

      const total = await SimSwapRequest.countDocuments(filter);
      const swapRequests = await SimSwapRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      return {
        success: true,
        swapRequests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get swap requests error:', error);
      return {
        success: false,
        errorMessage: 'Failed to retrieve swap requests',
      };
    }
  }

  /**
   * Get swap request by ID
   */
  async getSwapRequestById(swapRequestId: string): Promise<SwapServiceResult> {
    try {
      const swapRequest = await SimSwapRequest.findById(swapRequestId).lean();

      if (!swapRequest) {
        return {
          success: false,
          errorMessage: 'Swap request not found',
        };
      }

      return {
        success: true,
        swapRequest,
      };
    } catch (error) {
      logger.error('Get swap request by ID error:', error);
      return {
        success: false,
        errorMessage: 'Failed to retrieve swap request',
      };
    }
  }

  /**
   * Cancel swap request
   */
  async cancelSwapRequest(swapRequestId: string, userId: string): Promise<SwapServiceResult> {
    try {
      const swapRequest = await SimSwapRequest.findOne({
        _id: swapRequestId,
        userId,
      });

      if (!swapRequest) {
        return {
          success: false,
          errorMessage: 'Swap request not found',
        };
      }

      if (!['pending', 'processing', 'pending_review'].includes(swapRequest.status)) {
        return {
          success: false,
          errorMessage: 'Cannot cancel swap request in current status',
        };
      }

      swapRequest.status = 'cancelled';
      swapRequest.cancelledAt = new Date();
      await swapRequest.save();

      logger.info('Swap request cancelled', {
        swapRequestId: swapRequest._id,
        userId,
      });

      return {
        success: true,
        swapRequest: swapRequest.toObject(),
      };
    } catch (error) {
      logger.error('Cancel swap request error:', error);
      return {
        success: false,
        errorMessage: 'Failed to cancel swap request',
      };
    }
  }

  /**
   * Approve swap request (manual review)
   */
  async approveSwapRequest(
    swapRequestId: string,
    agentId: string,
    notes?: string
  ): Promise<SwapServiceResult> {
    try {
      const swapRequest = await SimSwapRequest.findById(swapRequestId);

      if (!swapRequest) {
        return {
          success: false,
          errorMessage: 'Swap request not found',
        };
      }

      if (swapRequest.status !== 'pending_review') {
        return {
          success: false,
          errorMessage: 'Swap request is not pending review',
        };
      }

      swapRequest.status = 'approved';
      swapRequest.finalDecision = 'approved';
      swapRequest.reviewedBy = agentId;
      swapRequest.reviewedAt = new Date();
      swapRequest.reviewNotes = notes;
      swapRequest.approvedAt = new Date();

      await swapRequest.save();

      logger.info('Swap request approved', {
        swapRequestId: swapRequest._id,
        agentId,
      });

      return {
        success: true,
        swapRequest: swapRequest.toObject(),
      };
    } catch (error) {
      logger.error('Approve swap request error:', error);
      return {
        success: false,
        errorMessage: 'Failed to approve swap request',
      };
    }
  }

  /**
   * Reject swap request (manual review)
   */
  async rejectSwapRequest(
    swapRequestId: string,
    agentId: string,
    reason: string
  ): Promise<SwapServiceResult> {
    try {
      const swapRequest = await SimSwapRequest.findById(swapRequestId);

      if (!swapRequest) {
        return {
          success: false,
          errorMessage: 'Swap request not found',
        };
      }

      if (swapRequest.status !== 'pending_review') {
        return {
          success: false,
          errorMessage: 'Swap request is not pending review',
        };
      }

      swapRequest.status = 'rejected';
      swapRequest.finalDecision = 'denied';
      swapRequest.reviewedBy = agentId;
      swapRequest.reviewedAt = new Date();
      swapRequest.reviewNotes = reason;
      swapRequest.rejectedAt = new Date();

      await swapRequest.save();

      logger.info('Swap request rejected', {
        swapRequestId: swapRequest._id,
        agentId,
      });

      return {
        success: true,
        swapRequest: swapRequest.toObject(),
      };
    } catch (error) {
      logger.error('Reject swap request error:', error);
      return {
        success: false,
        errorMessage: 'Failed to reject swap request',
      };
    }
  }

  /**
   * Update swap request status
   */
  async updateSwapRequestStatus(
    swapRequestId: string,
    status: SwapRequestStatus
  ): Promise<SwapServiceResult> {
    try {
      const swapRequest = await SimSwapRequest.findById(swapRequestId);

      if (!swapRequest) {
        return {
          success: false,
          errorMessage: 'Swap request not found',
        };
      }

      swapRequest.status = status;
      await swapRequest.save();

      return {
        success: true,
        swapRequest: swapRequest.toObject(),
      };
    } catch (error) {
      logger.error('Update swap request status error:', error);
      return {
        success: false,
        errorMessage: 'Failed to update swap request status',
      };
    }
  }

  /**
   * Add layer result to swap request
   */
  async addLayerResult(
    swapRequestId: string,
    layerResult: any
  ): Promise<SwapServiceResult> {
    try {
      const swapRequest = await SimSwapRequest.findById(swapRequestId);

      if (!swapRequest) {
        return {
          success: false,
          errorMessage: 'Swap request not found',
        };
      }

      swapRequest.layerResults.push(layerResult);
      await swapRequest.save();

      return {
        success: true,
        swapRequest: swapRequest.toObject(),
      };
    } catch (error) {
      logger.error('Add layer result error:', error);
      return {
        success: false,
        errorMessage: 'Failed to add layer result',
      };
    }
  }
}

export default SwapService;
