import { Response, NextFunction } from 'express';
import { AuthenticateRequest } from '../middleware/auth.middleware';
import { response } from '../utils/response.util';
import { SwapService } from '../services/swap/swap.service';
import { WorkflowService } from '../services/swap/workflow.service';
import { AuditService } from '../services/audit/audit.service';
import logger from '../utils/logger.util';

const swapService = new SwapService();
const workflowService = new WorkflowService();
const auditService = new AuditService();

/**
 * Create new SIM swap request
 */
export const createSwapRequest = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { currentPhoneNumber, newPhoneNumber, newSimCardNumber, reason, deviceFingerprint } = req.body;

    const result = await swapService.createSwapRequest({
      userId,
      currentPhoneNumber,
      newPhoneNumber,
      newSimCardNumber,
      reason,
      deviceFingerprint,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    if (!result.success) {
      response.internalError(res, result.errorMessage);
      return;
    }

    // Start workflow processing
    const workflowResult = await workflowService.processSwapRequest(result.swapRequestId!);

    // Create audit log
    await auditService.createAuditLog({
      userId,
      action: 'swap_request_created',
      resource: 'swap_request',
      resourceId: result.swapRequestId!,
      method: 'POST',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      details: { currentPhoneNumber, newPhoneNumber },
    });

    response.created(res, {
      swapRequestId: result.swapRequestId,
      status: workflowResult.status,
      finalDecision: workflowResult.finalDecision,
      message: 'SIM swap request created and processed',
    });
  } catch (error) {
    logger.error('Create swap request error:', error);
    response.internalError(res);
  }
};

/**
 * Get all swap requests (filtered by role)
 */
export const getSwapRequests = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { page = '1', limit = '10', status } = req.query;

    const result = await swapService.getSwapRequests({
      userId: userRole === 'customer' ? userId : undefined,
      status: status as string,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });

    if (!result.success) {
      response.internalError(res, result.errorMessage);
      return;
    }

    response.successWithPagination(res, result.swapRequests!, {
      page: result.pagination!.page,
      limit: result.pagination!.limit,
      total: result.pagination!.total,
      totalPages: result.pagination!.totalPages,
    });
  } catch (error) {
    logger.error('Get swap requests error:', error);
    response.internalError(res);
  }
};

/**
 * Get swap request by ID
 */
export const getSwapRequestById = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { id } = req.params;

    const result = await swapService.getSwapRequestById(id);

    if (!result.success) {
      response.notFound(res, 'Swap Request', id);
      return;
    }

    // Authorization check: customers can only see their own requests
    if (userRole === 'customer' && result.swapRequest!.userId !== userId) {
      response.forbidden(res);
      return;
    }

    response.success(res, result.swapRequest);
  } catch (error) {
    logger.error('Get swap request by ID error:', error);
    response.internalError(res);
  }
};

/**
 * Cancel swap request
 */
export const cancelSwapRequest = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await swapService.cancelSwapRequest(id, userId);

    if (!result.success) {
      response.internalError(res, result.errorMessage);
      return;
    }

    // Create audit log
    await auditService.createAuditLog({
      userId,
      action: 'swap_request_cancelled',
      resource: 'swap_request',
      resourceId: id,
      method: 'PUT',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    response.success(res, {
      message: 'Swap request cancelled successfully',
    });
  } catch (error) {
    logger.error('Cancel swap request error:', error);
    response.internalError(res);
  }
};

/**
 * Approve swap request (manual review)
 */
export const approveSwapRequest = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const agentId = req.user!.id;
    const { id } = req.params;
    const { notes } = req.body;

    const result = await swapService.approveSwapRequest(id, agentId, notes);

    if (!result.success) {
      response.internalError(res, result.errorMessage);
      return;
    }

    // Create audit log
    await auditService.createAuditLog({
      userId: agentId,
      action: 'swap_request_approved',
      resource: 'swap_request',
      resourceId: id,
      method: 'POST',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      details: { notes },
    });

    response.success(res, {
      message: 'Swap request approved successfully',
      swapRequest: result.swapRequest,
    });
  } catch (error) {
    logger.error('Approve swap request error:', error);
    response.internalError(res);
  }
};

/**
 * Reject swap request (manual review)
 */
export const rejectSwapRequest = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const agentId = req.user!.id;
    const { id } = req.params;
    const { reason } = req.body;

    const result = await swapService.rejectSwapRequest(id, agentId, reason);

    if (!result.success) {
      response.internalError(res, result.errorMessage);
      return;
    }

    // Create audit log
    await auditService.createAuditLog({
      userId: agentId,
      action: 'swap_request_rejected',
      resource: 'swap_request',
      resourceId: id,
      method: 'POST',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      details: { reason },
    });

    response.success(res, {
      message: 'Swap request rejected successfully',
      swapRequest: result.swapRequest,
    });
  } catch (error) {
    logger.error('Reject swap request error:', error);
    response.internalError(res);
  }
};

/**
 * Get workflow status (all 7 layers)
 */
export const getWorkflowStatus = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await swapService.getSwapRequestById(id);

    if (!result.success) {
      response.notFound(res, 'Swap Request', id);
      return;
    }

    response.success(res, {
      swapRequestId: id,
      status: result.swapRequest!.status,
      layerResults: result.swapRequest!.layerResults,
      riskScore: result.swapRequest!.riskScore,
      finalDecision: result.swapRequest!.finalDecision,
    });
  } catch (error) {
    logger.error('Get workflow status error:', error);
    response.internalError(res);
  }
};

/**
 * Get pending swap requests for manual review
 */
export const getPendingReviewRequests = async (
  req: AuthenticateRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '10' } = req.query;

    const result = await swapService.getSwapRequests({
      status: 'pending_review',
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });

    if (!result.success) {
      response.internalError(res, result.errorMessage);
      return;
    }

    response.successWithPagination(res, result.swapRequests!, {
      page: result.pagination!.page,
      limit: result.pagination!.limit,
      total: result.pagination!.total,
      totalPages: result.pagination!.totalPages,
    });
  } catch (error) {
    logger.error('Get pending review requests error:', error);
    response.internalError(res);
  }
};

export default {
  createSwapRequest,
  getSwapRequests,
  getSwapRequestById,
  cancelSwapRequest,
  approveSwapRequest,
  rejectSwapRequest,
  getWorkflowStatus,
  getPendingReviewRequests,
};
