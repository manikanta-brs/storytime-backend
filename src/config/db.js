import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not defined in the environment variables");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout for server selection
      socketTimeoutMS: 45000, // 45 seconds timeout for socket operations
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Database connection error: ${err.message}`, err);
    process.exit(1); // Exit the process if the database connection fails
  }

  process.on("SIGINT", async () => {
    console.log("Closing MongoDB connection...");
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  });
};

export default connectDB;
