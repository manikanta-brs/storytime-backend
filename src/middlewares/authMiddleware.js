import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import expressAsyncHandler from "express-async-handler";

const checkToken = expressAsyncHandler(async (req, res, next) => {
  let token;
  const authorizationHeader = req.headers.authorization;

  if (authorizationHeader && authorizationHeader.startsWith("Bearer")) {
    token = authorizationHeader.split(" ")[1];
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decodedToken);
      req.user = await User.findById(decodedToken.userId);

      const user = await User.findById(decodedToken.userId).select("-password");
      if (!user) {
        throw new Error("User not found");
      }
      req.user = user; // Attach user to request
      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, invalid token");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, token is required");
  }
});

export { checkToken };
