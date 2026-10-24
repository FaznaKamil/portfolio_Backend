import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/authService.js";
import * as emailService from "../services/emailService.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await authService.registerUser({ name, email, password });

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: result,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser({ email, password });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user._id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await authService.updateUserProfile(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: updatedUser,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const { resetToken, email: targetEmail } = await authService.createPasswordResetToken(email);

  await emailService.sendPasswordResetEmail(targetEmail, resetToken);

  res.status(200).json({
    success: true,
    message: "Password reset token generated. Check server console or recovery link.",
    // In dev environment, expose token for easy testing
    resetToken: process.env.NODE_ENV !== "production" ? resetToken : undefined,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPasswordWithToken(token, password);

  res.status(200).json({
    success: true,
    message: "Password has been successfully updated. You may now log in.",
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});
