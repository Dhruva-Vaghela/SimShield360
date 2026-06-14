import { SimSwapRequest } from '../../models/SimSwapRequest.model';
import { User } from '../../models/User.model';
import logger from '../../utils/logger.util';

// Telecom intelligence service
export class TelecomIntelligenceService {
  // Gather intelligence data for a user
  async gatherIntelligenceData(userId: string): Promise<{
    accountAge: number;
    previousSwaps: number;
    recentActivity: string;
    carrierHistory: string;
    suspiciousPatterns: string[];
  }> {
    try {
      // Get user
      const user = await User.findById(userId).exec();

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate account age
      const accountAgeDays = this.calculateAccountAge(user.createdAt);

      // Count previous swaps (last 90 days)
      const previousSwaps = await this.countPreviousSwaps(userId, 90);

      // Check recent activity (last 30 days)
      const recentActivity = await this.checkRecentActivity(userId, 30);

      // Get carrier history
      const carrierHistory = await this.getCarrierHistory(user.simCard?.msisdn);

      // Detect suspicious patterns
      const suspiciousPatterns = await this.detectSuspiciousPatterns(userId);

      return {
        accountAge: accountAgeDays,
        previousSwaps,
        recentActivity,
        carrierHistory,
        suspiciousPatterns,
      };
    } catch (error) {
      logger.error('Gather intelligence data error:', error);
      throw error;
    }
  }

  // Calculate account age in days
  private calculateAccountAge(createdAt: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(createdAt).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Count previous swaps within specified days
  private async countPreviousSwaps(userId: string, days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const count = await SimSwapRequest.countDocuments({
      userId,
      createdAt: { $gte: cutoffDate },
      status: { $in: ['approved', 'denied'] },
    });

    return count;
  }

  // Check recent activity
  private async checkRecentActivity(userId: string, days: number): Promise<string> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get recent swap requests
    const recentRequests = await SimSwapRequest.countDocuments({
      userId,
      createdAt: { $gte: cutoffDate },
    });

    // Get recent verification sessions
    // const recentSessions = await VerificationSession.countDocuments({
    //   userId,
    //   createdAt: { $gte: cutoffDate },
    // });

    if (recentRequests > 3) {
      return 'high_activity';
    } else if (recentRequests > 0) {
      return 'normal_activity';
    } else {
      return 'no_activity';
    }
  }

  // Get carrier history
  private async getCarrierHistory(msisdn?: string): Promise<string> {
    if (!msisdn) {
      return 'no_history';
    }

    // Implementation depends on telecom carrier API
    // For now, return mock data
    return 'clean_history';

    // Mock implementation
    // try {
    //   const response = await axios.get(`${process.env.TELECOM_API_ENDPOINT}/history/${msisdn}`);
    //   return response.data.historyStatus;
    // } catch (error) {
    //   return 'error';
    // }
  }

  // Detect suspicious patterns
  private async detectSuspiciousPatterns(userId: string): Promise<string[]> {
    const patterns: string[] = [];

    // Check for multiple devices in same request
    const recentRequests = await SimSwapRequest.find({
      userId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }).exec();

    const uniqueDevices = new Set(recentRequests.map((r) => r.deviceFingerprint));
    if (uniqueDevices.size > 3) {
      patterns.push('multiple_devices');
    }

    // Check for different locations in same request
    const uniqueLocations = new Set(
      recentRequests.map((r) => r.location?.country).filter(Boolean)
    );
    if (uniqueLocations.size > 2) {
      patterns.push('multiple_locations');
    }

    // Check for requests at unusual times
    const lateNightRequests = recentRequests.filter((r) => {
      const hour = new Date(r.createdAt).getHours();
      return hour < 6 || hour > 22;
    });

    if (lateNightRequests.length > 2) {
      patterns.push('unusual_timing');
    }

    return patterns;
  }

  // Check if request is suspicious
  async isRequestSuspicious(requestId: string): Promise<{
    isSuspicious: boolean;
    reasons: string[];
  }> {
    try {
      const request = await SimSwapRequest.findById(requestId).exec();

      if (!request) {
        throw new Error('Request not found');
      }

      const reasons: string[] = [];
      let isSuspicious = false;

      // Check for multiple recent requests
      const recentRequests = await SimSwapRequest.countDocuments({
        userId: request.userId,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      if (recentRequests >= 3) {
        reasons.push('Multiple recent requests');
        isSuspicious = true;
      }

      // Check for suspicious device
      const uniqueDevices = await SimSwapRequest.countDocuments({
        userId: request.userId,
        deviceFingerprint: request.deviceFingerprint,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      });

      if (uniqueDevices < 2) {
        reasons.push('New device for user');
        isSuspicious = true;
      }

      return {
        isSuspicious,
        reasons,
      };
    } catch (error) {
      logger.error('Check request suspicious error:', error);
      return { isSuspicious: false, reasons: [] };
    }
  }

  // Get carrier information
  async getCarrierInfo(msisdn: string): Promise<{
    carrier: string;
    isValid: boolean;
    country: string;
  }> {
    try {
      // Implementation depends on telecom carrier API
      // For now, return mock data
      return {
        carrier: 'Unknown',
        isValid: true,
        country: 'US',
      };

      // Mock implementation
      // try {
      //   const response = await axios.get(`${process.env.TELECOM_API_ENDPOINT}/carrier/${msisdn}`);
      //   return response.data;
      // } catch (error) {
      //   return {
      //     carrier: 'Unknown',
      //     isValid: false,
      //     country: 'US',
      //   };
      // }
    } catch (error) {
      logger.error('Get carrier info error:', error);
      return {
        carrier: 'Unknown',
        isValid: false,
        country: 'US',
      };
    }
  }
}

// Export service
export default TelecomIntelligenceService;
