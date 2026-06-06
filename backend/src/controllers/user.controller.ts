import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import type { AuthenticatedRequest } from "../types/user.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { generateToken } from "../utils/generateToken.js";
import type { Request, Response } from "express";
import { success } from "zod";

/**
 * Create a new user account
 * @route POST /api/v1/users/signup
 */
export const createUserAccount = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

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
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError("Email or Password is missing", 400);
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError("User not found", 404);
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
      sameSite: true,
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
    if (!name && !bio) {
      throw new ApiError("Either name or Bio is required", 400);
    }
    const user = await User.findById(new mongoose.Types.ObjectId(userId));
    if (!user) {
      throw new ApiError("User not found", 404);
    }
    user.name = name;
    user.bio = bio;
    await user.save();
    res.status(200).json({
      message: "User profile updated successfully",
      success: true,
      data: {
        name,
        bio,
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
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req;

    const user = await User.findById(new mongoose.Types.ObjectId(userId));

    if (!user) {
      throw new ApiError("No user found", 401);
    }

    const resetPasswordToken = await user.getResetPasswordToken();
    res.status(200).json({
      success: true,
      message: "Reset password token generated",
      data: { resetPasswordToken },
    });
  },
);

/**
 * Reset password
 * @route POST /api/v1/users/reset-password/
 */
export const resetPassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req;
    const { resetPasswordToken } = req.body;
    if (!resetPasswordToken) {
      throw new ApiError("No reset password token", 400);
    }

    const user = await User.findById(new mongoose.Types.ObjectId(userId));
    if (!user) {
      throw new ApiError("No user found", 400);
    }
    if (!user.resetPasswordTokenExpiry) {
      throw new ApiError("No password token expiry", 400);
    }
    if (user.resetPasswordTokenExpiry < new Date(Date.now())) {
      throw new ApiError("Reset Password Token Expired", 403);
    }

    const isValid = await user.compareResetPasswordToken(resetPasswordToken);
    if (!isValid) {
      throw new ApiError("Invalid reset password token", 400);
    }

    res.status(200).json({
      success: true,
      message: "Valid reset password token",
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
        sameSite: true,
      })
      .json({
        success: true,
        message: "User deleted successfully",
      });
  },
);
