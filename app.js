import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
// import SpotifyWebApi from "spotify-web-api-node";
import { errHandler, notFound } from "./src/middlewares/errMiddleware.js";
import languageRoute from "./src/routes/languageRoute.js";
import categoryRoute from "./src/routes/categoryRoute.js";
import userRoute from "./src/routes/userRoute.js";
// const nodemailer = require("nodemailer");

dotenv.config();
const port = process.env.PORT || 4000;
connectDB();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.get("/spotifytoken", async (req, res) => {
//   const spotifyAPI = new SpotifyWebApi({
//     clientId: "56a8d18afd98419290989b045ee4c03c",
//     clientSecret: "59abca5ae32a450791c7892a8f909a1b",
//   });
//   const spotifyCredentials = await spotifyAPI.clientCredentialsGrant();
//   console.log(spotifyCredentials);
//   const spotifytoken = spotifyCredentials.body;
//   res.status(200).send(spotifytoken);
// });

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use("/api/languages", languageRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/users", userRoute);

// app.get("/test", (req, res) => {
//   res.send("working..");
// });
app.get("/test", (req, res, next) => {
  const err = new Error("Something went wrong");
  return next(err);
});
// app.get("*", (req, res) => {
//   res.send("Page Not Found");
// });

app.use(notFound);
app.use(errHandler);

// async..await is not allowed in global scope, must use a wrapper

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
