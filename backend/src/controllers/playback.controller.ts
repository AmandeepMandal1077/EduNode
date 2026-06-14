import { asyncHandler } from "../utils/asynchandler.js";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/user.js";
import { getLectureProgressFromCahce, saveLectureProgressToCache } from "../cache/lecture-progress-cache.js";
import { CourseProgress, type ILectureProgress } from "../models/courseProgress.model.js";
import { LectureHeatmap } from "../models/lectureHeatmap.model.js";
import mongoose, { isValidObjectId, mongo } from "mongoose";
import { ApiError } from "../utils/apiError.js";
import { saveHeatmapSegmentToCache, type HeatmapSegment } from "../cache/lecture-heatmap-cache.js";

/**
 * @desc Fetches the last watched position of a lecture for the student.
 * @input {AuthenticatedRequest} req - The Express request object containing lectureId and courseId.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with the resume position.
 */
export const lectureLastWatchPosition = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const {
        lectureId,
        courseId,
    } = req.body;

    let resumePosition = await getLectureProgressFromCahce(userId, lectureId);
    if (!resumePosition) {
        const progress = await CourseProgress.findOne({
            user: userId,
            course: courseId,
            "lectureProgress.lecture": lectureId
        }, {
            "lectureProgress.$": 1
        }).lean();

        resumePosition = progress?.lectureProgress?.[0] ?? null;
    }

    return res.status(200).json({
        success: true,
        message: "Lecture last watch position fetched successfully",
        data: {
            resumePosition
        }
    })
})

/**
 * @desc Fetches the heatmap data for a specific lecture.
 * @input {Request} req - The Express request object containing the lectureId parameter.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with the heatmap data.
 */
export const getLectureHeatmap = asyncHandler(async (req: Request, res: Response) => {
    const { lectureId } = req.params;
    if (!lectureId || !isValidObjectId(lectureId)) {
        throw new ApiError("Invalid Lecture ID", 400);
    }
    const heatmap = await LectureHeatmap.aggregate([
        {
            $match: {
                lectureId: new mongoose.Types.ObjectId(lectureId),
            }
        },
        {
            $sort: {
                segmentIndex: 1
            }
        },
        {
            $project: {
                segmentIndex: 1,
                secondsWatched: 1
            }
        }
    ])

    return res.status(200).json({
        success: true,
        message: "Lecture heatmap fetched successfully",
        data: {
            heatmap
        }
    })
})

/**
 * @desc Syncs lecture progress and heatmap data with the cache.
 * @input {AuthenticatedRequest} req - The Express request object containing progress details.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response confirming successful sync.
 */
export const syncLectureProgressWithCache = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const { lectureId, currentPosition, previousPosition, lectureDuration } = req.body;

    const lectureProgressInfo: ILectureProgress = {
        userId: new mongoose.Types.ObjectId(userId),
        lecture: new mongoose.Types.ObjectId(lectureId),
        isCompleted: currentPosition >= lectureDuration * 0.95,
        lastWatchedPosition: currentPosition,
        lastWatched: new Date(),
    }

    const heatmapInfo: HeatmapSegment = {
        lectureId: lectureId,
        lectureDuration: lectureDuration,
        previousPosition: previousPosition,
        currentPosition: currentPosition,
    }

    await saveLectureProgressToCache(lectureProgressInfo);
    await saveHeatmapSegmentToCache(heatmapInfo)

    return res.status(200).json({
        success: true,
        message: "Lecture progress synced with cache successfully",
    })
})