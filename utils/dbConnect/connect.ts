import 'dotenv/config';
import mongoose from 'mongoose';

// DB CONFIGS
const dbHost = process.env.DB_HOSTNAME;
const dbUserName = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
// const mongoUrl =
//   'mongodb+srv://' +
//   dbUserName +
//   ':' +
//   dbPassword +
//   '@' +
//   dbHost +
//   '/' +
//   dbName +
//   '?' +
//   'retryWrites=true&w=majority';

const mongoUrl = process.env.MONGODB_URI;
// MONGODB CONNECTION & Admin cred
export const connectDB = async function () {
  try {
    await mongoose.connect(mongoUrl);
    console.info('💎 MongoDB connected!!');
    return;
  } catch (error: any) {
    console.error(error, '💀 something went wrong');
    return;
  }
};
