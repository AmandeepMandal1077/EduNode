import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import type { AuthenticatedRequest } from "../types/user.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { generateToken } from "../utils/generateToken.js";
import { addForgotPasswordJob } from "../queue/forgot-password.queue.js";
import type { Request, Response } from "express";

/**
 * Create a new user account
 * @route POST /api/v1/users/signup
 */
export const createUserAccount = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      throw new ApiError("Email or Password is missing", 400);
    }

    let user = await User.findOne({ email });

    if (user) {
      throw new ApiError("User already exists", 400);
    }

    user = await User.create({
      name,
      email,
      password,
      role,
    });

    res.status(201).json({
      message: "User account created successfully",
      success: true,
      data: {
        email,
      },
    });
  },
);

/**
 * Authenticate user and get token
 * @route POST /api/v1/users/signin
 */
export const authenticateUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
      throw new ApiError("Email or Password is missing", 400);
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    if (role && user.role !== role) {
      throw new ApiError(`You are not registered as an ${role}`, 403);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError("Invalid credentials", 401);
    }

    generateToken(res, user._id.toString(), "User logged in successfully");
  },
);

/**
 * Sign out user and clear cookie
 * @route POST /api/v1/users/signout
 */
export const signOutUser = asyncHandler(async (_: Request, res: Response) => {
  res
    .status(200)
    .clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
    .json({
      message: "User logout Successfully",
      success: true,
    });
});

/**
 * Get current user profile
 * @route GET /api/v1/users/profile
 */
export const getCurrentUserProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req;
    const user = await User.findById(new mongoose.Types.ObjectId(userId));
    if (!user) {
      throw new ApiError("User not found", 404);
    }
    res.status(200).json({
      message: "User profile fetched successfully",
      success: true,
      data: { user },
    });
  },
);

/**
 * Update user profile
 * @route PATCH /api/v1/users/profile
 */
export const updateUserProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req;
    const { name, bio } = req.body;
    if (!name && bio === undefined) {
      throw new ApiError("Either name or bio is required", 400);
    }
    const user = await User.findById(new mongoose.Types.ObjectId(userId));
    if (!user) {
      throw new ApiError("User not found", 404);
    }
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    await user.save();
    res.status(200).json({
      message: "User profile updated successfully",
      success: true,
      data: {
        user,
      },
    });
  },
);

/**
 * Change user password
 * @route PATCH /api/v1/users/change-password
 */
export const changeUserPassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req;
    const { password } = req.body;

    if (!password) {
      throw new ApiError("Password is required", 400);
    }

    const user = await User.findById(
      new mongoose.Types.ObjectId(userId),
    ).select("+password");
    if (!user) {
      throw new ApiError("No User found", 401);
    }

    user.password = password;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  },
);

/**
 * Request password reset
 * @route POST /api/v1/users/forgot-password
 */
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always respond 200 even if no user — prevents email enumeration
    if (!user) {
      res.status(200).json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
      });
      return;
    }

    const token = await user.getResetPasswordToken();
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await addForgotPasswordJob({
      username: user.name,
      email: user.email,
      resetUrl,
    });

    res.status(200).json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
    });
  },
);

/**
 * Reset password
 * @route POST /api/v1/users/reset-password/
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      throw new ApiError("Email, token and new password are required", 400);
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError("Invalid or expired reset link", 400);
    }
    if (!user.resetPasswordTokenExpiry) {
      throw new ApiError("Invalid or expired reset link", 400);
    }
    if (user.resetPasswordTokenExpiry < new Date(Date.now())) {
      throw new ApiError("Reset link has expired. Please request a new one.", 403);
    }

    const isValid = await user.compareResetPasswordToken(token);
    if (!isValid) {
      throw new ApiError("Invalid or expired reset link", 400);
    }

    // Set new password (pre-save hook will hash it)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now sign in.",
    });
  },
);

/**
 * Delete user account
 * @route DELETE /api/v1/users/account
 */
export const deleteUserAccount = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req;

    await User.findByIdAndDelete(new mongoose.Types.ObjectId(userId));

    res
      .status(200)
      .clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
      .json({
        success: true,
        message: "User deleted successfully",
      });
  },
);
