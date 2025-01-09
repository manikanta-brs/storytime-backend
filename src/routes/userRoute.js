import express from "express";
import {
  createUser,
  generateSpotifyRefreshToken,
  loginUser,
  verifyEmail,
  getUserProfile,
  updateUserProfile,
  updatePreferedLanguage,
  updatePassword,
  forgotPassword,
  resetPassword,
  saveSpotifyStory,
  removeSpotifyStory,
  getSpotifyStories,
} from "../controllers/userController.js";
import { checkToken } from "../middlewares/authMiddleware.js";
// import { Route } from "express";

const router = express.Router();

router.post("/register", createUser);
router.get("/verifyEmail/:verifyToken", verifyEmail);
router.post("/login", loginUser);
router.post("/refreshtoken", checkToken, generateSpotifyRefreshToken);
router.get("/profile", checkToken, getUserProfile);
router.post("/profile", checkToken, updateUserProfile);
router.post("/preferredlanguage", checkToken, updatePreferedLanguage);
router.post("/updatepassword", checkToken, updatePassword);
router.post("/forgotpassword", forgotPassword);
router.post("/resetpassword:token", resetPassword);
router.post("/savestory", checkToken, saveSpotifyStory);
router.delete("/removestory", checkToken, removeSpotifyStory);
router.get("/library", checkToken, getSpotifyStories);
export default router;
