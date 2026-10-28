import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/club-management';

const clearDummyData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Found collections:', collectionNames.join(', '));

    // Clear ALL collections (fresh start)
    for (const name of collectionNames) {
      const result = await db.collection(name).deleteMany({});
      console.log(`🗑️  Cleared '${name}': ${result.deletedCount} documents deleted`);
    }

    console.log('\n✅ All dummy data cleared! Database is fresh.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

clearDummyData();

