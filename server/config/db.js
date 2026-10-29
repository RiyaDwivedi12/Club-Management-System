import mongoose from 'mongoose';

// Primary MongoDB Atlas Cloud Connection String
const MONGO_ATLAS_URI = 'mongodb+srv://clubadmin:ClubAdmin2026@cluster0.d32voqg.mongodb.net/club-management?retryWrites=true&w=majority';

const connectDB = async () => {
  // Always prioritize MongoDB Atlas; ignore any legacy local 127.0.0.1 addresses
  let uri = process.env.MONGO_URI;
  if (!uri || uri.includes('127.0.0.1') || uri.includes('localhost')) {
    uri = MONGO_ATLAS_URI;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ Connected directly to MongoDB Atlas Cloud: ${conn.connection.host} (DB: ${conn.connection.name})`);
  } catch (error) {
    console.error(`❌ MongoDB Atlas Connection Error: ${error.message}`);
    console.log('👉 Ensure Atlas Network Access allows 0.0.0.0/0 (anywhere).');
  }
};

export default connectDB;
