import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  sendEmailVerificationLink,
  sendPasswordResetLink,
} from "../utils/utils.js";
import SpotifyWebApi from "spotify-web-api-node";
const createUser = async (req, res, next) => {
  const { firstname, lastname, email, password } = req.body;
  try {
    // Check if any field is missing
    if (!firstname || !lastname || !email || !password) {
      const error = new Error("Please fill all fields");
      error.statusCode = 400;
      return next(error);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = new Error("Invalid email");
      error.statusCode = 400;
      return next(error);
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      const error = new Error("User already exists");
      error.statusCode = 409;
      return next(error);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate token
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Send verification email
    try {
      const verificationEmailResponse = await sendEmailVerificationLink(
        email,
        token,
        firstname,
        lastname
      );

      // Handle error in sending email
      if (verificationEmailResponse.error) {
        const error = new Error("Error sending verification email");
        error.statusCode = 500;
        return next(error);
      }

      // Create and save user to database
      const user = await User.create({
        first_name: firstname, // Correct field name in model
        last_name: lastname, // Correct field name in model
        email,
        password: hashedPassword,
        verify_token: token, // Set the token in verify_token
        verify_token_expires: Date.now() + 120000, // 2 min ----- 1s = 1000ms
      });

      // Send success response
      res.status(201).send("Verification email sent");
    } catch (error) {
      return next(error);
    }

    // Send success response
    // res.status(201).json({
    //   message: "User registered successfully",
    //   user: { firstname, lastname, email },
    // }); // causes error  : cannot set headers error
  } catch (error) {
    return next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({ verify_token: req.params.verifyToken }); // Ensure param name matches
    if (!user) {
      return res.status(409).send("Verification link is invalid or expired.");
    }

    if (user.verify_token_expires <= Date.now()) {
      if (!user.verified) {
        await user.deleteOne(); // Delete unverified user
        return res
          .status(409)
          .send("Verification link expired. Please register again.");
      }
      return res.status(400).send("Please login to continue.");
    }

    if (user.verified) {
      return res.status(200).send("Email is already verified. Please login.");
    }

    // Mark user as verified
    user.verified = true;
    await user.save();
    return res.status(201).send("Email verified. Please login.");
  } catch (error) {
    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    const error = new Error("Please fill all fields");
    error.statusCode = 400;
    return next(error);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const error = new Error("Invalid email");
    error.statusCode = 400;
    return next(error);
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    if (!user.verified) {
      const error = new Error("Please verify your email");
      error.statusCode = 409;
      return next(error);
    }

    // Password checking
    const passwordMatched = await bcrypt.compare(password, user.password);
    if (!passwordMatched) {
      const error = new Error("Invalid email or password");
      error.statusCode = 400;
      return next(error);
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email },
      process.env.JWT_SECRET,
      { expiresIn: 2592000 } // 30 days
    );
    user.token = token;
    await user.save();

    // Generate Spotify token
    const spotifyAPI = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    const spotifyCredentials = await spotifyAPI.clientCredentialsGrant();
    const spotifyToken = spotifyCredentials.body;

    // Token expiry time
    const expireIn = 259200;

    // Send response
    return res.status(200).json({ token, spotifyToken, expireIn });
  } catch (error) {
    return next(error);
  }
};

const generateSpotifyRefreshToken = async (req, res, next) => {
  try {
    const spotifyAPI = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    const spotifyCredentials = await spotifyAPI.clientCredentialsGrant();
    const spotifyToken = spotifyCredentials.body;
    res.status(200).json({ spotifyToken });
  } catch (error) {
    next(new Error("Failed to generate Spotify refresh token."));
  }
};

// const getUserProfile = async (req, res, next) => {
//   const user = await User.findById(req.user._id);

//   if (user) {
//     const profileData = {
//       _id: user._id,
//       firstname: user.first_name,
//       lastname: user.last_name,
//       email: user.email,
//       languages: user.languages || [],
//     };
//     // res.json({ profileData });
//     res.status(200).json(profileData);
//   } else {
//     res.send(404);
//     const err = new Error("User not found");
//     err.statusCode = 404;
//     return next(err);
//   }
// };
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }
    const profileData = {
      _id: user._id,
      firstname: user.first_name,
      lastname: user.last_name,
      email: user.email,
      languages: user.languages || [],
    };
    res.status(200).json(profileData);
  } catch (error) {
    return next(error);
  }
};
const updateUserProfile = async (req, res, next) => {
  const { first_name, last_name, email } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }
    if (first_name || last_name) {
      user.first_name = first_name || user.first_name;
      user.last_name = last_name || user.last_name;
    }
    if (email && email !== user.email) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        const err = new Error("Email already exists");
        err.statusCode = 409;
        return next(err);
      }
      user.email = email;
    }
    await user.save();
    res.status(200).json({ message: "updated successfully" });
  } catch (error) {
    return next(error);
  }
};

const updatePreferedLanguage = async (req, res, next) => {
  const { languageIds } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }
    user.languages = languageIds;
    await user.save();
    res.status(200).json({ message: "updated successfully" });
  } catch (error) {
    return next(error);
  }
};

const updatePassword = async (req, res, next) => {
  const { password } = req.body;
  if (!password) {
    const err = new Error("Password is required");
    err.statusCode = 400;
    return next(err);
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }
    // password hash
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return next(error);
  }
};
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    const error = new Error("Email is required");
    error.statusCode = 400;
    return next(error);
  }
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      const error = new Error("Email not found!");
      error.statusCode = 404;
      return next(error);
    }
    // generate token
    const token = jwt.sign(
      { userId: user._id, email },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );
    // save token in db
    user.reset_password_token = token;
    user.reset_password_expires = Date.now() + 1200000; // 2 minutes
    await user.save();
    // send email with token
    const verificationEmailResponse = await sendEmailVerificationLink(
      email,
      token,
      user.first_name
    );
    // handle error
    if (verificationEmailResponse.error) {
      const error = new Error("Failed to send reset email");
      error.statusCode = 500;
      return next(error);
    }
    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!token) {
    const error = new Error("Token is required");
    error.statusCode = 400;
    return next(error);
  }
  if (!password) {
    const error = new Error("Password is required");
    error.statusCode = 400;
    return next(error);
  }
  // find the user by token
  const user = await User.findOne({
    reset_password_token: token,
    reset_password_expires: { $gt: Date.now() },
  });
  if (!user) {
    const error = new Error("Token is invalid or expired");
    error.statusCode = 401;
    return next(error);
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;
  user.reset_password_token = null;
  user.reset_password_expires = null;
  await user.save();
  res.status(200).json({ message: "Password reset successfully" });
};

const saveSpotifyStory = async (req, res, next) => {
  const { storyId } = req.body;
  if (!storyId) {
    const error = new Error("Story ID is required");
    error.statusCode = 400;
    return next(error);
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }
    if (user.saved_stories.includes(storyId)) {
      return res.status(409).json({ message: "Story already saved" });
    }
    user.saved_stories.push(storyId);
    await user.save();
    res.status(200).json({ message: "Story saved successfully" });
  } catch (error) {
    return next(error);
  }
};
const removeSpotifyStory = async (req, res, next) => {
  const { storyId } = req.body;
  if (!storyId) {
    const error = new Error("Story ID is required");
    error.statusCode = 400;
    return next(error);
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }
    const index = user.saved_stories.indexOf(storyId);
    if (index === -1) {
      const err = new Error("Invalid Story ID");
      err.statusCode = 404;
      return next(err);
    }
    user.saved_stories.splice(index, 1);
    await user.save();
    res.status(200).json({ message: "Story removed successfully" });
  } catch (error) {
    return next(error);
  }
};

// const getSpotifyStories = async (req, res, next) => {
//   try {
//     // Check if req.user is defined and contains _id
//     if (!req.user || !req.user._id) {
//       const error = new Error("User not authenticated");
//       error.statusCode = 401; // Unauthorized error
//       return next(error);
//     }

//     // Find user by ID
//     const user = await User.findById(req.user._id);
//     if (!user) {
//       const error = new Error("User not found");
//       error.statusCode = 404; // Not found error
//       return next(error);
//     }

//     // Fetch saved stories
//     const stories = await Story.find({ _id: { $in: user.saved_stories } });
//     res.status(200).json(stories);
//   } catch (error) {
//     // Pass the error to the next middleware
//     return next(error);
//   }
// };
const getSpotifyStories = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }
    const stories = user.saved_stories;
    res.status(200).json({ stories });
  } catch (error) {
    return next(error);
  }
};

export {
  createUser,
  verifyEmail,
  loginUser,
  generateSpotifyRefreshToken,
  getUserProfile,
  updateUserProfile,
  updatePreferedLanguage,
  updatePassword,
  forgotPassword,
  resetPassword,
  saveSpotifyStory,
  removeSpotifyStory,
  getSpotifyStories,
};
