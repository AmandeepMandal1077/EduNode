import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { EUploadStatus, Lecture } from "../models/lecture.model.js";
import { ChatMessage } from "../models/chatMessage.model.js";
import mongoose from "mongoose";
import type { AuthenticatedRequest } from "../types/user.js";
import {
    getChatMessagesFromCache,
    saveChatMessagesToCache,
    invalidateChatMessagesInCache,
} from "../cache/chat-messages-cache.js";

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
 * @desc Routes a user question to the RAG service, saves both messages to DB, and returns the answer.
 * @input {AuthenticatedRequest} req - Contains lectureId, courseId, and question.
 * @input {Response} res - Returns fetched answer.
 */
export const chatWithLecture = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { lectureId, courseId, question } = req.body;
    const userId = req.userId;

    if (!lectureId || !courseId || !question) {
        throw new ApiError("Missing fields", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(lectureId) || !mongoose.Types.ObjectId.isValid(courseId)) {
        throw new ApiError("Invalid IDs", 400);
    }

    const ragServerUrl = process.env.RAG_SERVER_URL || "http://rag-service:8000";
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

    // Save user message and assistant response to DB
    await ChatMessage.create([
        {
            userId: new mongoose.Types.ObjectId(userId),
            courseId: new mongoose.Types.ObjectId(courseId),
            lectureId: new mongoose.Types.ObjectId(lectureId),
            role: "user",
            content: question,
        },
        {
            userId: new mongoose.Types.ObjectId(userId),
            courseId: new mongoose.Types.ObjectId(courseId),
            lectureId: new mongoose.Types.ObjectId(lectureId),
            role: "assistant",
            content: answer.message,
        },
    ]);

    // Invalidate cache so next fetch gets fresh data
    await invalidateChatMessagesInCache(userId, courseId, lectureId);

    return res.status(200).json({
        success: true,
        message: "Answer fetched successfully",
        data: answer,
    });
});

/**
 * @desc Fetches chat history for a user on a specific course/lecture. Cache-first with DB fallback.
 * @input {AuthenticatedRequest} req - Contains courseId and lectureId in params.
 * @input {Response} res - Returns array of chat messages.
 */
export const getChatHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { courseId, lectureId } = req.params;
    const userId = req.userId;

    if (!courseId || !lectureId) {
        throw new ApiError("Missing fields", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(lectureId)) {
        throw new ApiError("Invalid IDs", 400);
    }

    // Try cache first
    const cached = await getChatMessagesFromCache(userId, courseId, lectureId);
    if (cached) {
        return res.status(200).json({
            success: true,
            message: "Chat history fetched from cache",
            data: { messages: cached },
        });
    }

    // Fallback to DB
    const messages = await ChatMessage.find({
        userId: new mongoose.Types.ObjectId(userId),
        courseId: new mongoose.Types.ObjectId(courseId),
        lectureId: new mongoose.Types.ObjectId(lectureId),
    }).sort({ createdAt: 1 });

    // Save to cache for next time
    await saveChatMessagesToCache(userId, courseId, lectureId, messages);

    return res.status(200).json({
        success: true,
        message: "Chat history fetched successfully",
        data: { messages },
    });
});
