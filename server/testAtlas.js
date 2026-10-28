import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('❌ Error: MONGO_URI is missing from server/.env');
  process.exit(1);
}

console.log('🔄 Attempting to connect to MongoDB Atlas...');
console.log(`Connecting to: ${uri.replace(/:([^:@]+)@/, ':****@')}`); // Hide password in logs

try {
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log(`\n🎉 Connection Successful!`);
  console.log(`Database Host: ${conn.connection.host}`);
  console.log(`Database Name: ${conn.connection.name}`);
  await mongoose.disconnect();
  console.log('Disconnected cleanly. Your MongoDB Atlas connection is working properly!');
  process.exit(0);
} catch (error) {
  console.error(`\n❌ Connection Failed: ${error.message}`);
  if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
    console.error('👉 Cause: Incorrect username or password in your MONGO_URI.');
  } else if (error.message.includes('ETIMEDOUT') || error.message.includes('buffering timed out') || error.message.includes('Server selection timed out')) {
    console.error('👉 Cause: IP Address blocked. Please ensure IP "0.0.0.0/0" is added to Network Access in Atlas.');
  } else {
    console.error('👉 Please check your connection string syntax.');
  }
  process.exit(1);
}
