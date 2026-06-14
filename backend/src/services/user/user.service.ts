import { User } from '../../models/User.model';
import logger from '../../utils/logger.util';

// User service
export class UserService {
  // Get user by ID
  async getUserById(userId: string): Promise<{
    success: boolean;
    user?: any;
  }> {
    try {
      const user = await User.findById(userId).select('-passwordHash -authenticator').exec();

      if (!user) {
        return { success: false };
      }

      return {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          profile: user.profile,
          simCard: user.simCard,
          isActive: user.isActive,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    } catch (error) {
      logger.error('Get user by ID error:', error);
      return { success: false };
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<{
    success: boolean;
    user?: any;
  }> {
    try {
      const user = await User.findOne({ email }).select('+passwordHash').exec();

      if (!user) {
        return { success: false };
      }

      return {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          passwordHash: user.passwordHash,
          role: user.role,
          profile: user.profile,
          isActive: user.isActive,
          isVerified: user.isVerified,
          authenticator: user.authenticator,
        },
      };
    } catch (error) {
      logger.error('Get user by email error:', error);
      return { success: false };
    }
  }

  // Create user
  async createUser(data: {
    email: string;
    password: string;
    role: 'customer' | 'agent';
    profile: {
      firstName: string;
      lastName: string;
      phone: string;
    };
  }): Promise<{
    success: boolean;
    userId?: string;
    errorMessage?: string;
  }> {
    try {
      // Check if email already exists
      const existingUser = await User.findOne({ email: data.email }).exec();

      if (existingUser) {
        return {
          success: false,
          errorMessage: 'Email already exists',
        };
      }

      // Create user
      const user = await User.create({
        email: data.email,
        passwordHash: data.password,
        role: data.role,
        profile: data.profile,
        isActive: true,
        isVerified: false,
      });

      return {
        success: true,
        userId: user._id.toString(),
      };
    } catch (error) {
      logger.error('Create user error:', error);
      return {
        success: false,
        errorMessage: 'Failed to create user',
      };
    }
  }

  // Update user profile
  async updateProfile(userId: string, data: {
    profile?: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    };
  }): Promise<{
    success: boolean;
    user?: any;
  }> {
    try {
      const user = await User.findById(userId).exec();

      if (!user) {
        return { success: false };
      }

      // Update profile
      if (data.profile) {
        if (data.profile.firstName) user.profile.firstName = data.profile.firstName;
        if (data.profile.lastName) user.profile.lastName = data.profile.lastName;
        if (data.profile.phone) user.profile.phone = data.profile.phone;
      }

      await user.save();

      return {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          profile: user.profile,
        },
      };
    } catch (error) {
      logger.error('Update profile error:', error);
      return {
        success: false,
      };
    }
  }

  // Update user password
  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{
    success: boolean;
    errorMessage?: string;
  }> {
    try {
      const user = await User.findById(userId).select('+passwordHash').exec();

      if (!user) {
        return { success: false, errorMessage: 'User not found' };
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        return { success: false, errorMessage: 'Current password is incorrect' };
      }

      // Validate new password
      // const passwordValidation = await validatePassword(newPassword);

      // Update password
      user.passwordHash = newPassword;
      await user.save();

      // Invalidate all sessions (implementation depends on session service)
      // await sessionService.invalidateAllSessions(userId);

      logger.info('Password updated', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Update password error:', error);
      return {
        success: false,
        errorMessage: 'Failed to update password',
      };
    }
  }

  // Update last login timestamp
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(userId, {
        lastLogin: new Date(),
      }).exec();
    } catch (error) {
      logger.error('Update last login error:', error);
    }
  }

  // Increment failed login attempts
  async incrementFailedLoginAttempts(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId).exec();

      if (user) {
        user.incrementFailedAttempts();
        await user.save();

        if (!user.isActive) {
          logger.warn('Account locked due to failed attempts', { userId });
        }
      }
    } catch (error) {
      logger.error('Increment failed login attempts error:', error);
    }
  }

  // Reset failed login attempts
  async resetFailedLoginAttempts(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId).exec();

      if (user) {
        user.resetFailedAttempts();
        await user.save();
      }
    } catch (error) {
      logger.error('Reset failed login attempts error:', error);
    }
  }

  // Unlock account
  async unlockAccount(userId: string): Promise<{
    success: boolean;
  }> {
    try {
      const user = await User.findById(userId).exec();

      if (!user) {
        return { success: false };
      }

      user.unlockAccount();
      await user.save();

      logger.info('Account unlocked', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Unlock account error:', error);
      return { success: false };
    }
  }

  // List users (admin only)
  async listUsers(
    page: number = 1,
    limit: number = 20,
    role?: string,
    isActive?: boolean
  ): Promise<{
    success: boolean;
    users?: any[];
    total?: number;
  }> {
    try {
      const query: Record<string, unknown> = {};

      if (role) {
        query.role = role;
      }

      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      const [users, total] = await Promise.all([
        User.find(query)
          .select('-passwordHash -authenticator')
          .skip((page - 1) * limit)
          .limit(limit)
          .exec(),
        User.countDocuments(query).exec(),
      ]);

      return {
        success: true,
        users: users.map((user) => ({
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          profile: user.profile,
          isActive: user.isActive,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        })),
        total,
      };
    } catch (error) {
      logger.error('List users error:', error);
      return { success: false };
    }
  }
}

// Export service
export default UserService;
