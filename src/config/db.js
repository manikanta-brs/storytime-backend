import mongoose from "mongoose";

const connectDB = async () => {
  // delays the execution for connection
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI); // waits until for connection
    console.log(
      `MongoDB connected successfully on port ${conn.connection.host}` // conn.connection.port and conn.connection.host
      //  are the properties of the connection object
    );
  } catch (err) {
    console.log(err);
    process.exit(1); // to stop the server if an error exists
  }
};

export default connectDB;
