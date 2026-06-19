import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { EUploadStatus, Lecture } from "../models/lecture.model.js";
import mongoose from "mongoose";

/**
 * @desc Updates the upload status of a lecture to COMPLETED after VectorDB processing.
 * @input {Request} req - Contains lecture_id and course_id.
 * @input {Response} res - Returns status of operation.
 */
export const vectordbProcessed = asyncHandler(async (req: Request, res: Response) => {
    const { lecture_id: lectureId, course_id: courseId } = req.body;

    if (!lectureId || !courseId) {
        throw new ApiError("Missing fields", 400); // 400 Bad Request makes more sense than 501
    }

    const updatedLecture = await Lecture.findOneAndUpdate({
        _id: new mongoose.Types.ObjectId(lectureId),
        courseId: new mongoose.Types.ObjectId(courseId),
    }, {
        uploadStatus: EUploadStatus.COMPLETED
    }, { new: true });

    if (!updatedLecture) {
        throw new ApiError("Lecture not found", 404);
    }

    res.status(200).json({ success: true, message: "Status updated successfully" });
});

/**
 * @desc Routes a user question to the RAG service and returns the answer.
 * @input {Request} req - Contains lectureId, courseId, and question.
 * @input {Response} res - Returns fetched answer.
 */
export const chatWithLecture = asyncHandler(async (req: Request, res: Response) => {
    const { lectureId, courseId, question } = req.body;

    if (!lectureId || !courseId || !question) {
        throw new ApiError("Missing fields", 400); // 400 Bad Request
    }

    const ragServerUrl = process.env.RAG_SERVER_URL || "http://host.docker.internal:8000";
    const response = await fetch(`${ragServerUrl}/chat/${courseId}/${lectureId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ question })
    });

    if (!response.ok) {
        return res.status(502).json({
            success: false,
            message: "Failed to fetch answer from RAG service",
        });
    }

    const answer = await response.json();

    return res.status(200).json({
        success: true,
        message: "Answer fetched successfully",
        data: answer,
    });
});
