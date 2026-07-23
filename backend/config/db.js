import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/qa_ai_agent";
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Primary MongoDB connection failed (${error.message}). Starting In-Memory MongoDB fallback...`);
    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      const conn = await mongoose.connect(uri, { dbName: "qa_ai_agent" });
      console.log(`In-Memory MongoDB started and connected successfully!`);
    } catch (fallbackError) {
      console.error(`In-Memory MongoDB error: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

export default connectDB;
