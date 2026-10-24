import { verifyToken } from "../utils/generateToken.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.js";
import { getDbConnectionStatus } from "../config/database.js";
import { memoryStore } from "../services/memoryStore.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ApiError(401, "Not authorized, no token provided"));
  }

  try {
    const decoded = verifyToken(token);

    if (getDbConnectionStatus()) {
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return next(new ApiError(401, "User not found or account removed"));
      }
      req.user = user;
    } else {
      // In-memory fallback
      const user = memoryStore.users.find((u) => u._id.toString() === decoded.id.toString());
      if (!user) {
        return next(new ApiError(401, "User not found"));
      }
      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
    }

    next();
  } catch (error) {
    return next(new ApiError(401, "Not authorized, token invalid or expired"));
  }
};
