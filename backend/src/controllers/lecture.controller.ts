import mongoose from "mongoose";
import type { AuthenticatedRequest } from "../types/user.js";
import { ApiError } from "../utils/apiError.js";
import { Lecture } from "../models/lecture.model.js";
import { Course } from "../models/course.model.js";
import { asyncHandler } from "../utils/asynchandler.js";
import type { Response } from "express";

/**
 * @desc Retrieves details of a specific lecture by ID.
 * @input {AuthenticatedRequest} req - The Express request object containing the lectureId parameter.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with the lecture data.
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
 * @desc Deletes a specific lecture from a course and updates the course's lecture count.
 * @input {AuthenticatedRequest} req - The Express request object containing the lectureId parameter.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response confirming successful deletion.
 */
export const deleteLecture = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { lectureId } = req.params;
    if (!lectureId) {
      throw new ApiError("lectureId is required", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      throw new ApiError("Invalid lectureId", 400);
    }

    const lecture = await Lecture.findById(new mongoose.Types.ObjectId(lectureId));
    if (!lecture) {
      throw new ApiError("Lecture not found", 404);
    }

    const course = await Course.findById(lecture.courseId);
    if (!course) {
      throw new ApiError("Associated course not found", 404);
    }

    if (course.instructor.toString() !== req.userId) {
      throw new ApiError("You are not authorized to perform this action", 403);
    }

    await Course.findByIdAndUpdate(lecture.courseId, {
      $pull: { lectures: lecture._id },
      $inc: { totalLectures: -1 },
    });

    await Lecture.findByIdAndDelete(lecture._id);

    return res.status(200).json({
      success: true,
      message: "Lecture deleted successfully",
    });
  },
);


