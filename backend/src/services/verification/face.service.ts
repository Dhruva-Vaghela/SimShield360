import { FaceProfile } from '../../models/FaceProfile.model';
import { User } from '../../models/User.model';
import { AuditLog } from '../../models/AuditLog.model';
import logger from '../../utils/logger.util';

/**
 * Face Verification Service - Simulation-Based Implementation
 * 
 * This is a simulation layer for hackathon MVP purposes.
 * No camera access, no liveness detection, no face-api.js.
 * 
 * UI should provide two options:
 * - Match Face: Returns success with high confidence
 * - Not Match Face: Returns failure with low confidence
 */
export class FaceVerificationService {
  /**
   * Simulate face verification based on user selection
   * 
   * @param userId - User ID
   * @param simulationResult - "match" or "no_match" from UI
   * @returns Verification result with confidence score
   */
  async verifyFace(
    userId: string, 
    simulationResult: 'match' | 'no_match'
  ): Promise<{
    success: boolean;
    confidence?: number;
    errorMessage?: string;
  }> {
    try {
      // Get user's face profile (for audit trail)
      const faceProfile = await FaceProfile.getActiveProfile(userId);

      if (!faceProfile) {
        return {
          success: false,
          errorMessage: 'Face profile not found. Please register your face first.',
        };
      }

      // Simulation-based verification
      if (simulationResult === 'match') {
        // User selected "Match Face"
        const confidence = 96; // High confidence score

        // Update face profile statistics
        await faceProfile.incrementVerificationCount();

        // Create audit log
        await AuditLog.create({
          userId,
          action: 'face_verified',
          resource: 'face_profile',
          resourceId: faceProfile._id.toString(),
          method: 'POST',
          ipAddress: 'unknown',
          metadata: {
            simulationResult: 'match',
            confidence,
          },
        });

        logger.info('Face verification successful (simulation)', {
          userId,
          confidence,
        });

        return {
          success: true,
          confidence,
        };
      } else {
        // User selected "Not Match Face"
        const confidence = 42; // Low confidence score

        // Create audit log for failed attempt
        await AuditLog.create({
          userId,
          action: 'face_verification_failed',
          resource: 'face_profile',
          resourceId: faceProfile._id.toString(),
          method: 'POST',
          ipAddress: 'unknown',
          metadata: {
            simulationResult: 'no_match',
            confidence,
          },
        });

        logger.warn('Face verification failed (simulation)', {
          userId,
          confidence,
        });

        return {
          success: false,
          confidence,
          errorMessage: 'Face does not match. Verification failed.',
        };
      }
    } catch (error) {
      logger.error('Face verification error:', error);
      return {
        success: false,
        errorMessage: 'Face verification failed. Please try again.',
      };
    }
  }

  /**
   * Register face profile - Simulation version
   * Just creates a profile entry for audit trail purposes
   * 
   * @param userId - User ID
   * @returns Face profile ID
   */
  async registerFaceProfile(userId: string): Promise<{
    success: boolean;
    faceProfileId?: string;
    errorMessage?: string;
  }> {
    try {
      // Get user
      const user = await User.findById(userId).exec();

      if (!user) {
        return {
          success: false,
          errorMessage: 'User not found',
        };
      }

      // Create or update face profile (simulation data)
      const faceProfile = await FaceProfile.upsertProfile(
        userId, 
        'simulation_face_profile', 
        0.9
      );

      // Create audit log
      await AuditLog.create({
        userId,
        action: 'face_profile_registered',
        resource: 'face_profile',
        resourceId: faceProfile._id.toString(),
        method: 'POST',
        ipAddress: 'unknown',
        metadata: {
          type: 'simulation',
        },
      });

      logger.info('Face profile registered (simulation)', {
        userId,
        faceProfileId: faceProfile._id.toString(),
      });

      return {
        success: true,
        faceProfileId: faceProfile._id.toString(),
      };
    } catch (error) {
      logger.error('Face profile registration error:', error);
      return {
        success: false,
        errorMessage: 'Failed to register face profile. Please try again.',
      };
    }
  }
}

// Export service
export default FaceVerificationService;
