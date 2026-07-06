import { connect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { AttackLog } from '../models/AttackLog.model';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'simshield';
const TEST_REQ_ID = `REQ-SCRIPT-${Date.now()}`;

async function testAttacks() {
  console.log('\n🔐 SimShield 360 — Attack Log DB Test\n' + '─'.repeat(45));

  if (!MONGODB_URI) {
    console.error('❌  MONGODB_URI not set in backend/.env');
    process.exit(1);
  }

  // ── Connect ───────────────────────────────────────
  process.stdout.write('🔌  Connecting to MongoDB Atlas... ');
  await connect(MONGODB_URI, { dbName: MONGODB_DB_NAME, serverSelectionTimeoutMS: 8000 });
  console.log('✅  Connected');

  // ── Collection stats ──────────────────────────────
  const total = await AttackLog.countDocuments();
  console.log(`📦  attacklogs collection: ${total} existing record(s)\n`);

  // ── 1. CREATE ─────────────────────────────────────
  process.stdout.write(`📝  [1/3] Creating test record (${TEST_REQ_ID})... `);
  const created = await AttackLog.create({
    requestId: TEST_REQ_ID,
    targetCustomer: 'Script Test User',
    customerNumber: '+91 00000 00000',
    attackType: 'sim_swap',
    location: 'London',
    device: 'Attacker Kali Linux',
    network: 'Tor Proxy Network',
    fakeDocuments: true,
    multipleAttempts: true,
    riskScore: 97,
    status: 'started',
    currentLayer: 'None',
    logs: [{ type: 'info', message: 'Test script: attack initialized' }],
  });
  console.log(`✅  Created (_id: ${created._id})`);

  // ── 2. UPDATE ─────────────────────────────────────
  process.stdout.write(`✏️   [2/3] Updating status to "blocked"... `);
  const updated = await AttackLog.findOneAndUpdate(
    { requestId: TEST_REQ_ID },
    {
      $set: { status: 'blocked', currentLayer: 'Layer 1: SIM Lock Firewall', riskScore: 99 },
      $push: { logs: { type: 'error', message: 'Test script: blocked at SIM Lock', timestamp: new Date() } },
    },
    { new: true }
  );
  console.log(`✅  Updated (status=${updated?.status}, risk=${updated?.riskScore}, logs=${updated?.logs.length})`);

  // ── 3. READ BACK ──────────────────────────────────
  process.stdout.write(`🔍  [3/3] Reading back from Atlas... `);
  const fetched = await AttackLog.findOne({ requestId: TEST_REQ_ID });
  if (!fetched) throw new Error('Record not found after write!');
  console.log(`✅  Verified\n`);

  console.log('  Request ID   :', fetched.requestId);
  console.log('  Customer     :', fetched.targetCustomer);
  console.log('  Attack Type  :', fetched.attackType);
  console.log('  Location     :', fetched.location);
  console.log('  Risk Score   :', fetched.riskScore);
  console.log('  Status       :', fetched.status);
  console.log('  Current Layer:', fetched.currentLayer);
  console.log('  Log entries  :', fetched.logs.length);
  fetched.logs.forEach((l, i) => console.log(`    [${i + 1}] [${l.type}] ${l.message}`));

  // ── Cleanup ───────────────────────────────────────
  console.log('\n🧹  Cleaning up test record...');
  await AttackLog.deleteOne({ requestId: TEST_REQ_ID });
  console.log('✅  Deleted test record\n');

  const newTotal = await AttackLog.countDocuments();
  console.log(`📊  Final collection size: ${newTotal} record(s)`);
  console.log('\n' + '─'.repeat(45));
  console.log('🎉  All tests passed — Atlas read/write working!\n');
}

testAttacks()
  .catch((err) => {
    console.error('\n❌  Test failed:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await connection.close();
    console.log('🔌  Connection closed.');
  });
