import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/club-management';
  try {
    const isAtlas = uri.includes('mongodb+srv');
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected (${isAtlas ? 'Atlas Cloud' : 'Local'}): ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (uri.includes('mongodb+srv')) {
      console.log('👉 For MongoDB Atlas:');
      console.log('   1. Check your IP Access List in Atlas Network Access (make sure 0.0.0.0/0 is added).');
      console.log('   2. Verify username and password in MONGO_URI.');
    } else {
      console.log('👉 Ensure your local MongoDB service is running on 127.0.0.1:27017.');
    }
  }
};

export default connectDB;
