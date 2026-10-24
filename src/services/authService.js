import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { generateToken } from "../utils/generateToken.js";
import { getDbConnectionStatus } from "../config/database.js";
import { memoryStore } from "./memoryStore.js";

export const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  if (getDbConnectionStatus()) {
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists");
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: "customer", // Enforce role is always customer
    });

    const token = generateToken({ id: user._id, role: user.role });
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses,
        wishlist: user.wishlist,
      },
      token,
    };
  } else {
    // In-memory fallback
    const existing = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new ApiError(409, "An account with this email already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = {
      _id: "user_" + Date.now(),
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "customer",
      addresses: [],
      wishlist: [],
      createdAt: new Date(),
    };
    memoryStore.users.push(newUser);

    const token = generateToken({ id: newUser._id, role: newUser.role });
    return {
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        addresses: newUser.addresses,
        wishlist: newUser.wishlist,
      },
      token,
    };
  }
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  if (getDbConnectionStatus()) {
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    const token = generateToken({ id: user._id, role: user.role });
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses,
        wishlist: user.wishlist,
      },
      token,
    };
  } else {
    const user = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    const token = generateToken({ id: user._id, role: user.role });
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses || [],
        wishlist: user.wishlist || [],
      },
      token,
    };
  }
};

export const getUserById = async (userId) => {
  if (getDbConnectionStatus()) {
    const user = await User.findById(userId).select("-password");
    if (!user) throw new ApiError(404, "User not found");
    return user;
  } else {
    const user = memoryStore.users.find((u) => u._id.toString() === userId.toString());
    if (!user) throw new ApiError(404, "User not found");
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
};

export const updateUserProfile = async (userId, updateData) => {
  const { name, email, currentPassword, newPassword } = updateData;

  if (getDbConnectionStatus()) {
    const user = await User.findById(userId).select("+password");
    if (!user) throw new ApiError(404, "User not found");

    if (newPassword) {
      if (!currentPassword) {
        throw new ApiError(400, "Current password is required to set a new password");
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        throw new ApiError(400, "Current password does not match");
      }
      user.password = newPassword;
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase().trim();

    await user.save();
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      addresses: user.addresses,
      wishlist: user.wishlist,
    };
  } else {
    const user = memoryStore.users.find((u) => u._id.toString() === userId.toString());
    if (!user) throw new ApiError(404, "User not found");

    if (newPassword) {
      if (!currentPassword) {
        throw new ApiError(400, "Current password is required to set a new password");
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        throw new ApiError(400, "Current password does not match");
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase().trim();

    const { password, ...safeUser } = user;
    return safeUser;
  }
};

export const createPasswordResetToken = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  if (getDbConnectionStatus()) {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw new ApiError(404, "No account with that email address exists");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = expiresAt;
    await user.save();
  } else {
    const user = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) throw new ApiError(404, "No account with that email address exists");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = expiresAt;
  }

  return { resetToken, email: normalizedEmail };
};

export const resetPasswordWithToken = async (rawToken, newPassword) => {
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  if (getDbConnectionStatus()) {
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, "Password reset token is invalid or has expired");
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return true;
  } else {
    const user = memoryStore.users.find(
      (u) => u.resetPasswordToken === hashedToken && u.resetPasswordExpires > Date.now()
    );

    if (!user) {
      throw new ApiError(400, "Password reset token is invalid or has expired");
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    return true;
  }
};
