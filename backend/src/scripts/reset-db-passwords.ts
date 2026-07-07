import { connectDatabase } from '../config/database.config';
import { connection } from 'mongoose';
import { User } from '../models/User.model';
import logger from '../utils/logger.util';

const resetPasswords = async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await connectDatabase();
    console.log('✅ Connected.');

    // 1. Seed users to reset
    const defaultUsers = [
      { email: 'rahul.patel@example.com', password: 'password123' },
      { email: 'priya.sharma@example.com', password: 'password123' },
      { email: 'vikram.mehta@example.com', password: 'password123' },
      { email: 'amit.sharma@telecom.in', password: 'password123' },
      { email: 'admin@simshield360.com', password: 'Admin123!' }
    ];

    console.log('🔄 Resetting passwords for seed users...');
    for (const du of defaultUsers) {
      const user = await User.findOne({ email: du.email }).exec();
      if (user) {
        user.passwordHash = du.password; // The pre-save hook will hash it once
        await user.save();
        console.log(`   ✨ Reset password for: ${du.email}`);
      } else {
        console.log(`   ℹ️ User ${du.email} not found. Skipping.`);
      }
    }

    // 2. Custom users to reset
    console.log('🔄 Resetting passwords for custom registered users...');
    const allUsers = await User.find({}).exec();
    const defaultEmails = defaultUsers.map(du => du.email);

    for (const user of allUsers) {
      if (!defaultEmails.includes(user.email)) {
        user.passwordHash = 'Password123!'; // The pre-save hook will hash it once
        await user.save();
        console.log(`   ✨ Reset password for custom user: ${user.email} (New password: Password123!)`);
      }
    }

    console.log('\n🎉 Password reset completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to reset passwords:', error);
    console.error('❌ Failed to reset passwords:', error);
    process.exit(1);
  }
};

resetPasswords();
