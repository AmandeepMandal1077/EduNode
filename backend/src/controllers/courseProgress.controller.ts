import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/user.js";
import { asyncHandler } from "../utils/asynchandler.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.js";
import { CourseProgress } from "../models/courseProgress.model.js";

/**
 * Get user's progress for a specific course
 * @route GET /api/v1/progress/:courseId
 */
export const getUserCourseProgress = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const { courseId } = req.params;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError("Invalid courseId", 400);
    }

    const courseProgress = await CourseProgress.findOne({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
    }).select(`-_id -course -user -lectureProgress._id`);

    if (!courseProgress) {
      throw new ApiError("Course progress not found", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Course progress fetched successfully",
      data: courseProgress,
    });
  },
);

/**
 * Update progress for a specific lecture
 * @route PATCH /api/v1/progress/:courseId/lectures/:lectureId
 */
export const updateLectureProgress = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { courseId, lectureId } = req.params;
    const userId = req.userId;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError("Invalid courseId", 400);
    }

    if (!lectureId || !mongoose.Types.ObjectId.isValid(lectureId)) {
      throw new ApiError("Invalid lectureId", 400);
    }

    const { isCompleted, watchTime, lastWatchedPosition, lastWatched } = req.body;
    const position =
      lastWatchedPosition !== undefined ? lastWatchedPosition : watchTime;
    const updateBody = Object.fromEntries(
      Object.entries({
        "lectureProgress.$.isCompleted": isCompleted,
        "lectureProgress.$.lastWatchedPosition": position,
        "lectureProgress.$.lastWatched": lastWatched,
      }).filter(([_, value]) => value !== undefined),
    );

    const courseProgress = await CourseProgress.findOneAndUpdate(
      {
        user: new mongoose.Types.ObjectId(userId),
        course: new mongoose.Types.ObjectId(courseId),
        "lectureProgress.lecture": new mongoose.Types.ObjectId(lectureId),
      },
      {
        $set: updateBody,
      },
      {
        new: true,
        runValidators: true,
      },
    ).select(`-_id -course -user -lectureProgress._id`);

    if (!courseProgress) {
      throw new ApiError("Course progress not found", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Lecture progress updated successfully",
      data: courseProgress,
    });
  },
);

/**
 * Mark entire course as completed
 * @route PATCH /api/v1/progress/:courseId/complete
 */
export const markCourseAsCompleted = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { courseId } = req.params;
    const userId = req.userId;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError("Invalid courseId", 400);
    }

    const courseProgress = await CourseProgress.findOneAndUpdate(
      {
        user: new mongoose.Types.ObjectId(userId),
        course: new mongoose.Types.ObjectId(courseId),
      },
      {
        $set: {
          isCompleted: true,
          completionPercentage: 100,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    ).select(`-_id -course -user -lectureProgress._id`);

    if (!courseProgress) {
      throw new ApiError("Course progress not found", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Course progress marked as completed successfully",
      data: courseProgress,
    });
  },
);

/**
 * Reset course progress
 * @route PATCH /api/v1/progress/:courseId/reset
 */
export const resetCourseProgress = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { courseId } = req.params;
    const userId = req.userId;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError("Invalid courseId", 400);
    }

    const courseProgress = await CourseProgress.findOneAndUpdate(
      {
        user: new mongoose.Types.ObjectId(userId),
        course: new mongoose.Types.ObjectId(courseId),
      },
      {
        $set: {
          isCompleted: false,
          completionPercentage: 0,
          lectureProgress: [],
        },
      },
      {
        new: true,
        runValidators: true,
      },
    ).select(`-_id -course -user -lectureProgress._id`);

    if (!courseProgress) {
      throw new ApiError("Course progress not found", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Course progress reset successfully",
      data: courseProgress,
    });
  },
);
