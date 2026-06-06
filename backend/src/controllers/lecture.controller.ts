import mongoose from "mongoose";
import type { AuthenticatedRequest } from "../types/user.js";
import { ApiError } from "../utils/apiError.js";
import { Lecture } from "../models/lecture.model.js";
import { asyncHandler } from "../utils/asynchandler.js";
import type { Response } from "express";
import { Comment } from "../models/comment.model.js";

/**
 * Get lecture details
 * @route GET /api/v1/lecture/:lectureId
 */
export const getLectureDetails = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { lectureId } = req.params;
    if (!lectureId) {
      throw new ApiError("All fields are required", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      throw new ApiError("Invalid lectureId", 400);
    }
    const lecture = await Lecture.findOne({
      _id: new mongoose.Types.ObjectId(lectureId),
    });
    if (!lecture) {
      throw new ApiError("Lecture not found", 404);
    }
    return res.status(200).json({
      success: true,
      message: "Lecture fetched successfully",
      data: { lecture },
    });
  },
);

/**
 * Get comments for a lecture
 * @route GET /api/v1/lecture/:lectureId/comments
 */
export const getComments = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { lectureId } = req.params;
    if (!lectureId) {
      throw new ApiError("All fields are required", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      throw new ApiError("Invalid lectureId", 400);
    }
    const comments = await Comment.find({
      lectureId: new mongoose.Types.ObjectId(lectureId),
    }).populate({
      path: "userId",
      select: "name",
    });
    return res.status(200).json({
      success: true,
      message: "Comments fetched successfully",
      data: { comments },
    });
  },
);
