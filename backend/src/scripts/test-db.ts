import { connect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'simshield';

async function testDatabase() {
  if (!MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI is not set in backend/.env');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB Atlas...');
  console.log(`🔗 URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log(`📂 Target Database: ${MONGODB_DB_NAME}\n`);

  try {
    await connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ Connected successfully!');
    
    const db = connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections:`);
    
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   🔹 ${col.name}: ${count} document(s)`);
    }

    console.log('\n👤 Registered Users (in "users" collection):');
    const users = await db.collection('users').find({}).toArray();
    
    if (users.length === 0) {
      console.log('   ℹ️ No users found in this collection.');
    } else {
      users.forEach((user, index) => {
        console.log(`   [${index + 1}] Email: ${user.email} | Role: ${user.role} | Created: ${user.createdAt || 'N/A'}`);
      });
    }

  } catch (err: any) {
    console.error('❌ Database Connection Error:', err.message);
  } finally {
    await connection.close();
    console.log('\n🔌 Connection closed.');
  }
}

testDatabase();
