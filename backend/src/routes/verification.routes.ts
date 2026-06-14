import { Router } from 'express';
import * as verificationController from '../controllers/verification.controller';
import * as verificationValidator from '../validators/verification.validator';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { globalLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Submit face verification (simulation-based)
router.post('/face', authenticate, validateBody(verificationValidator.faceVerificationSchema), globalLimiter, verificationController.submitFaceVerification);

// Submit authenticator code
router.post('/authenticator', authenticate, validateBody(verificationValidator.authenticatorVerificationSchema), globalLimiter, verificationController.submitAuthenticatorCode);

// Google Authenticator Management
router.post('/authenticator/setup', authenticate, globalLimiter, verificationController.setupAuthenticator);
router.post('/authenticator/enable', authenticate, validateBody(verificationValidator.enableAuthenticatorSchema), globalLimiter, verificationController.enableAuthenticator);
router.post('/authenticator/disable', authenticate, validateBody(verificationValidator.disableAuthenticatorSchema), globalLimiter, verificationController.disableAuthenticator);
router.get('/authenticator/status', authenticate, verificationController.getAuthenticatorStatus);

// Grant device consent
router.post('/device-consent', authenticate, validateBody(verificationValidator.deviceConsentSchema), globalLimiter, verificationController.grantDeviceConsent);

// Get verification session status
router.get('/sessions/:id', authenticate, verificationController.getVerificationSessionStatus);

// Export router
export default router;
