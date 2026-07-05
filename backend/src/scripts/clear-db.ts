import { connectDatabase } from '../config/database.config';
import { connection } from 'mongoose';
import { AttackLog } from '../models/AttackLog.model';
import { AuditLog } from '../models/AuditLog.model';
import { FaceProfile } from '../models/FaceProfile.model';
import { Notification } from '../models/Notification.model';
import { RiskLog } from '../models/RiskLog.model';
import { SimLock } from '../models/SimLock.model';
import { SimSwapRequest } from '../models/SimSwapRequest.model';
import { TrustedDevice } from '../models/TrustedDevice.model';
import { VerificationSession } from '../models/VerificationSession.model';

const clearDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await connectDatabase();
    console.log('✅ Connected.');

    console.log('🧹 Clearing transaction logs, simulator attacks, and lock states...');

    // List of models to wipe with loose typing to prevent compiler union checks
    const collectionsToWipe: { name: string; model: any }[] = [
      { name: 'AttackLog', model: AttackLog },
      { name: 'AuditLog', model: AuditLog },
      { name: 'FaceProfile', model: FaceProfile },
      { name: 'Notification', model: Notification },
      { name: 'RiskLog', model: RiskLog },
      { name: 'SimLock', model: SimLock },
      { name: 'SimSwapRequest', model: SimSwapRequest },
      { name: 'TrustedDevice', model: TrustedDevice },
      { name: 'VerificationSession', model: VerificationSession }
    ];

    for (const item of collectionsToWipe) {
      const result = await item.model.deleteMany({});
      console.log(`   🗑️ Wiped ${item.name}: Deleted ${result.deletedCount} document(s)`);
    }

    console.log('\n🎉 Database reset completed successfully! (Demo users kept)');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to clear database:', error);
    process.exit(1);
  }
};

clearDatabase();
