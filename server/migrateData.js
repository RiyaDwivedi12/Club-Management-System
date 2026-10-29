import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const ATLAS_URI = process.env.MONGO_URI || 'mongodb+srv://clubadmin:ClubAdmin2026@cluster0.d32voqg.mongodb.net/club-management?retryWrites=true&w=majority';

// Try common local database names
const LOCAL_CANDIDATE_URIS = [
  'mongodb://127.0.0.1:27017/club-management',
  'mongodb://localhost:27017/club-management',
  'mongodb://127.0.0.1:27017/test',
  'mongodb://localhost:27017/test',
  'mongodb://127.0.0.1:27017/clubsphere',
  'mongodb://localhost:27017/clubsphere'
];

async function findLocalConnection() {
  for (const uri of LOCAL_CANDIDATE_URIS) {
    try {
      console.log(`🔍 Probing local MongoDB at: ${uri}`);
      const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 2500 }).asPromise();
      const adminDb = conn.db.admin();
      const dbs = await adminDb.listDatabases();
      console.log(`✅ Connected to local MongoDB! Available local databases:`, dbs.databases.map(d => `${d.name} (${Math.round(d.sizeOnDisk / 1024)} KB)`).join(', '));
      
      // Look for candidate database that has data
      const targetDbName = dbs.databases.find(d => ['club-management', 'clubsphere', 'club_management', 'test'].includes(d.name) && d.sizeOnDisk > 0)?.name || 'club-management';
      console.log(`🎯 Selected local database to migrate: "${targetDbName}"`);
      await conn.close();

      const targetConn = await mongoose.createConnection(`mongodb://127.0.0.1:27017/${targetDbName}`, { serverSelectionTimeoutMS: 3000 }).asPromise();
      return { conn: targetConn, dbName: targetDbName };
    } catch (err) {
      // try next
    }
  }
  return null;
}

async function migrate() {
  console.log('========================================================');
  console.log('🚀 MONGODB LOCAL -> MONGODB ATLAS DATA MIGRATION');
  console.log('========================================================\n');

  // 1. Connect to Local MongoDB
  const local = await findLocalConnection();
  if (!local) {
    console.error('❌ Could not connect to any local MongoDB instance on port 27017.');
    console.error('👉 Please make sure MongoDB is running locally (e.g. "mongod" or MongoDB Windows Service).');
    process.exit(1);
  }

  const { conn: localConn, dbName: localDbName } = local;

  // 2. Connect to Atlas
  console.log(`\n☁️  Connecting to MongoDB Atlas...`);
  let atlasConn;
  try {
    atlasConn = await mongoose.createConnection(ATLAS_URI, { serverSelectionTimeoutMS: 15000 }).asPromise();
    console.log(`✅ Connected to Atlas host: ${atlasConn.host} (DB: ${atlasConn.name})\n`);
  } catch (err) {
    console.error(`❌ Atlas connection failed: ${err.message}`);
    await localConn.close();
    process.exit(1);
  }

  // 3. List Collections from local
  const localCollections = await localConn.db.listCollections().toArray();
  const collectionNames = localCollections.map(c => c.name).filter(name => !name.startsWith('system.'));

  console.log(`📦 Found ${collectionNames.length} collections in local database "${localDbName}":`);
  console.log(collectionNames.map(c => `   - ${c}`).join('\n'));
  console.log('\n🔄 Starting data migration into Atlas...\n');

  let totalDocsMigrated = 0;
  const summary = [];

  for (const collName of collectionNames) {
    try {
      const localColl = localConn.db.collection(collName);
      const atlasColl = atlasConn.db.collection(collName);

      const docs = await localColl.find({}).toArray();
      const count = docs.length;

      if (count === 0) {
        summary.push({ collection: collName, localCount: 0, migrated: 0, status: 'Empty (Skipped)' });
        console.log(`⚪ Collection [${collName}]: 0 documents (empty, skipped)`);
        continue;
      }

      // Upsert documents by _id into Atlas
      let insertedCount = 0;
      let updatedCount = 0;

      const bulkOps = docs.map(doc => ({
        replaceOne: {
          filter: { _id: doc._id },
          replacement: doc,
          upsert: true
        }
      }));

      const res = await atlasColl.bulkWrite(bulkOps, { ordered: false });
      insertedCount = (res.upsertedCount || 0) + (res.insertedCount || 0);
      updatedCount = res.modifiedCount || 0;
      const totalProcessed = insertedCount + updatedCount;
      totalDocsMigrated += totalProcessed;

      summary.push({
        collection: collName,
        localCount: count,
        migrated: totalProcessed,
        status: `Success (${insertedCount} new / ${updatedCount} updated)`
      });

      console.log(`✅ [${collName}]: ${count} docs -> ${totalProcessed} transferred to Atlas (${insertedCount} new, ${updatedCount} updated)`);
    } catch (collErr) {
      console.error(`⚠️  Error migrating collection [${collName}]:`, collErr.message);
      summary.push({ collection: collName, localCount: 'Unknown', migrated: 0, status: `Failed: ${collErr.message}` });
    }
  }

  console.log('\n========================================================');
  console.log('📊 MIGRATION SUMMARY');
  console.log('========================================================');
  console.table(summary);
  console.log(`🎉 Total Documents Processed / Transferred to Atlas: ${totalDocsMigrated}`);
  console.log('========================================================\n');

  await localConn.close();
  await atlasConn.close();
  console.log('🔌 Connections closed cleanly. Migration finished successfully!');
}

migrate().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
