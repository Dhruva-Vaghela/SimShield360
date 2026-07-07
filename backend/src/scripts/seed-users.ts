import { connectDatabase } from '../config/database.config';
import { connection } from 'mongoose';
import { User } from '../models/User.model';
import { PasswordHasher } from '../utils/crypto.util';
import logger from '../utils/logger.util';

const seedUsers = async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await connectDatabase();
    console.log('✅ Connected.');

    const defaultUsers = [
      {
        email: 'rahul.patel@example.com',
        password: 'password123',
        role: 'customer' as const,
        profile: {
          firstName: 'Rahul',
          lastName: 'Patel',
          phone: '+91 98250 12345',
        },
        authenticator: {
          secret: 'JBSWY3DPEHPK3PXP',
          isEnabled: true,
          backupCodes: [],
        }
      },
      {
        email: 'priya.sharma@example.com',
        password: 'password123',
        role: 'customer' as const,
        profile: {
          firstName: 'Priya',
          lastName: 'Sharma',
          phone: '+91 97110 54321',
        },
        authenticator: {
          secret: 'JBSWY3DPEHPK3PXQ',
          isEnabled: true,
          backupCodes: [],
        }
      },
      {
        email: 'vikram.mehta@example.com',
        password: 'password123',
        role: 'customer' as const,
        profile: {
          firstName: 'Vikram',
          lastName: 'Mehta',
          phone: '+91 98980 88888',
        },
        authenticator: {
          secret: 'JBSWY3DPEHPK3PXR',
          isEnabled: true,
          backupCodes: [],
        }
      },
      {
        email: 'amit.sharma@telecom.in',
        password: 'password123',
        role: 'agent' as const,
        profile: {
          firstName: 'Amit',
          lastName: 'Sharma',
          phone: '+91 99999 88888',
        },
        authenticator: {
          secret: 'JBSWY3DPEHPK3PXS',
          isEnabled: true,
          backupCodes: [],
        }
      }
    ];

    console.log('🌱 Seeding demo profiles...');
    for (const u of defaultUsers) {
      // Check if user already exists in Atlas
      const exists = await User.findOne({ email: u.email }).exec();
      if (exists) {
        console.log(`   ℹ️ User ${u.email} already exists. Skipping.`);
        continue;
      }

      await User.create({
        email: u.email,
        passwordHash: u.password,
        role: u.role,
        profile: u.profile,
        authenticator: u.authenticator,
        isActive: true,
        isVerified: true,
      });

      console.log(`   ✨ Created ${u.role}: ${u.email}`);
    }

    console.log('\n🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to seed users:', error);
    console.error('❌ Failed to seed users:', error);
    process.exit(1);
  }
};

seedUsers();
