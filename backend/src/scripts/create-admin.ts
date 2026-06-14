import { connectDatabase } from '../config/database.config';
import { User } from '../models/User.model';
import { PasswordHasher } from '../utils/crypto.util';
import logger from '../utils/logger.util';

// Create admin user script
const createAdminUser = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Check if admin user already exists
    const adminUser = await User.findOne({ email: 'admin@simshield360.com' }).exec();

    if (adminUser) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const passwordHash = await PasswordHasher.hashPassword(process.env.ADMIN_PASSWORD || 'Admin123!');

    const admin = await User.create({
      email: 'admin@simshield360.com',
      passwordHash,
      role: 'admin',
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        phone: '+1234567890',
      },
      isActive: true,
      isVerified: true,
    });

    console.log('Admin user created successfully');
    console.log('Email: admin@simshield360.com');
    console.log('Password: ' + (process.env.ADMIN_PASSWORD || 'Admin123!'));
    console.log('User ID: ' + admin._id.toString());

    process.exit(0);
  } catch (error) {
    logger.error('Failed to create admin user:', error);
    console.error('Failed to create admin user');
    process.exit(1);
  }
};

// Run script
createAdminUser();
