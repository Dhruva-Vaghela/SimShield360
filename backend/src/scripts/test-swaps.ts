import { connect, connection, Types } from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { SimSwapRequest } from '../models/SimSwapRequest.model';
import { User } from '../models/User.model';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'simshield';

async function testSwaps() {
  console.log('\n🔐 SimShield 360 — SimSwapRequest DB Test\n' + '─'.repeat(45));

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set in backend/.env');
    process.exit(1);
  }

  // Connect to database
  process.stdout.write('🔌 Connecting to MongoDB Atlas... ');
  await connect(MONGODB_URI, { dbName: MONGODB_DB_NAME, serverSelectionTimeoutMS: 8000 });
  console.log('✅ Connected');

  // Verify collections
  const total = await SimSwapRequest.countDocuments();
  console.log(`📦 simswaprequests collection: ${total} existing record(s)`);

  // Find a user to reference (e.g. Rahul Patel)
  const user = await User.findOne({ email: 'rahul.patel@example.com' });
  if (!user) {
    console.error('❌ Pre-requisite user "rahul.patel@example.com" not found. Please run seed-users script first.');
    process.exit(1);
  }
  console.log(`👤 Referencing User: ${user.email} (ID: ${user._id})`);

  // 1. Create a test swap request
  const testId = `REQ-SWAP-TEST-${Date.now()}`;
  process.stdout.write('📝 [1/3] Creating test swap request document... ');
  const created = await SimSwapRequest.create({
    requestId: testId,
    userId: user._id,
    currentPhoneNumber: '+919825012345',
    newPhoneNumber: '+919825012345',
    newSimCardNumber: '8991123456789012345',
    reason: 'Upgrading physical SIM card to a new 5G enabled card for my primary phone.',
    status: 'pending',
    layerResults: [
      {
        layer: 1,
        name: 'SIM Lock Firewall',
        passed: true,
        score: 0,
        timestamp: new Date()
      }
    ],
    riskScore: 10,
    riskLevel: 'low',
    ipAddress: '127.0.0.1',
    userAgent: 'ts-node-script-tester'
  });
  console.log(`✅ Created (_id: ${created._id})`);

  // 2. Fetch the created swap request
  process.stdout.write('🔍 [2/3] Querying request from Atlas... ');
  const fetched = await SimSwapRequest.findOne({ requestId: testId });
  if (!fetched) throw new Error('Swap request not found after database write!');
  console.log('✅ Found');
  console.log('  Request ID      :', fetched.requestId);
  console.log('  User Reference  :', fetched.userId);
  console.log('  Current Phone   :', fetched.currentPhoneNumber);
  console.log('  New SIM Card #  :', fetched.newSimCardNumber);
  console.log('  Status          :', fetched.status);
  console.log('  Risk Level      :', fetched.riskLevel);
  console.log('  Reason          :', fetched.reason);

  // 3. Clean up the test request
  process.stdout.write('🧹 [3/3] Deleting test request document... ');
  await SimSwapRequest.deleteOne({ requestId: testId });
  console.log('✅ Deleted');

  const finalTotal = await SimSwapRequest.countDocuments();
  console.log(`📊 Final collection size: ${finalTotal} record(s)`);
  console.log('─'.repeat(45));
  console.log('🎉 All swap-request database checks passed successfully!\n');
}

testSwaps()
  .catch((err) => {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await connection.close();
    console.log('🔌 Connection closed.');
  });
