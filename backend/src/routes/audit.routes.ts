import { Router } from 'express';
import * as auditController from '../controllers/audit.controller';
import * as auditValidator from '../validators/audit.validator';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { globalLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// List audit logs (agent or admin)
router.get('/', authenticate, authorize('agent', 'admin'), globalLimiter, auditController.listAuditLogs);

// Get user activity logs (agent or admin)
router.get('/users/:userId', authenticate, authorize('agent', 'admin'), globalLimiter, auditController.getUserActivityLogs);

// Export audit logs (agent or admin)
router.get('/export', authenticate, authorize('agent', 'admin'), auditController.exportAuditLogs);

// Export router
export default router;
