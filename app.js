import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import { errHandler, notFound } from "./src/middlewares/errMiddleware.js";
import languageRoute from "./src/routes/languageRoute.js";
import categoryRoute from "./src/routes/categoryRoute.js";
import userRoute from "./src/routes/userRoute.js";
import cors from "cors";
import useragent from "express-useragent";
import path from "path";

// Load environment variables
dotenv.config();
const port = process.env.PORT || 4000;

// Connect to the database
await connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(useragent.express());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.send("Hello, World!");
});
app.use("/api/languages", languageRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/users", userRoute);

// Test route to trigger error
app.get("/test", (req, res, next) => {
  const err = new Error("Something went wrong");
  next(err);
});

// Set up EJS view engine
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const normalizedDirname = __dirname.replace(/^\/?/, "").replace(/\\/g, "/");

app.set("view engine", "ejs");
app.set("views", path.join(normalizedDirname, "src", "templates"));

// Error handling middleware
app.use(notFound);
app.use(errHandler);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
