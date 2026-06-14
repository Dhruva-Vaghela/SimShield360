import { Router } from 'express';

// Import route modules
import authRoutes from './auth.routes';
import simLockRoutes from './simlock.routes';
import swapRoutes from './swap.routes';
import deviceRoutes from './device.routes';
import riskRoutes from './risk.routes';
import verificationRoutes from './verification.routes';
import auditRoutes from './audit.routes';
import notificationRoutes from './notification.routes';

// Create router
const router = Router();

// Mount individual route modules
router.use('/auth', authRoutes);
router.use('/simlocks', simLockRoutes);
router.use('/swap-requests', swapRoutes);
router.use('/devices', deviceRoutes);
router.use('/risk', riskRoutes);
router.use('/verification', verificationRoutes);
router.use('/audit', auditRoutes);
router.use('/notifications', notificationRoutes);

// Health check route
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'SIMShield 360 API is running',
    timestamp: new Date().toISOString(),
  });
});

// Export router
export default router;
