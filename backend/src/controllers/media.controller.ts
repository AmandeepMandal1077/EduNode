import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asynchandler.js";
import { generatePresignedPutUrl } from "../utils/s3.js";
import { Lecture, EUploadStatus } from "../models/lecture.model.js";
import { MediaUpload, EMediaUploadStatus } from "../models/mediaUpload.model.js";
import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { ApiError } from "../utils/apiError.js";
import { v4 as uuidv4 } from "uuid";
import type { AuthenticatedRequest } from "../types/user.js";
import mongoose from "mongoose";
import { getPublicUrl } from "../utils/s3.js";

/**
 * @desc Creates a presigned upload URL and tracks the pending upload session.
 * @input {AuthenticatedRequest} req - The request containing upload details (type, entityId, fileName, contentType).
 * @input {Response} res - The response object.
 * @output {Promise<void>} Sends a JSON response with presigned URL and uploadSessionId.
 */
export const createUploadSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { type, entityId, fileName, contentType } = req.body;
  const userId = req.userId;

  if (!type || !entityId || !fileName || !contentType) {
    throw new ApiError("type, entityId, fileName, and contentType are required", 400);
  }

  const uploadSessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  let s3Key = "";

  if (type === "avatar") {
    if (entityId !== userId) {
      throw new ApiError("Unauthorized", 403);
    }
    s3Key = `root/avatars/users/${userId}/${Date.now()}_${fileName}`;

    // Create MediaUpload
    await MediaUpload.create({
      uploadSessionId,
      userId: new mongoose.Types.ObjectId(userId),
      entityType: "avatar",
      entityId,
      s3Key,
      status: EMediaUploadStatus.PENDING_UPLOAD,
      presignedUrlExpiresAt: expiresAt,
    });
  } else if (type === "course-image") {
    // Verify course ownership
    const course = await Course.findById(entityId);
    if (!course) throw new ApiError("Course not found", 404);
    if (course.instructor.toString() !== userId) throw new ApiError("Unauthorized", 403);

    s3Key = `root/courses/${entityId}/images/${Date.now()}_${fileName}`;

    await MediaUpload.create({
      uploadSessionId,
      userId: new mongoose.Types.ObjectId(userId),
      entityType: "course-image",
      entityId,
      s3Key,
      status: EMediaUploadStatus.PENDING_UPLOAD,
      presignedUrlExpiresAt: expiresAt,
    });
  } else if (type === "lecture-video") {
    throw new ApiError("Use /api/v1/course/:courseId/lectures to add a lecture", 400);
  } else {
    throw new ApiError("Invalid upload type", 400);
  }

  const presignedUrl = await generatePresignedPutUrl(s3Key, contentType, 900);

  res.status(200).json({
    success: true,
    data: {
      uploadSessionId,
      s3Key,
      presignedUrl,
      expiresAt,
    },
  });
});

/**
 * @desc Poll the status of an upload session.
 * @input {AuthenticatedRequest} req - The request containing uploadSessionId as route parameter.
 * @input {Response} res - The response object.
 * @output {Promise<void>} Sends a JSON response with the session's upload status.
 */
export const getUploadStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { uploadSessionId } = req.params;

  if (!uploadSessionId) {
    throw new ApiError("uploadSessionId is required", 400);
  }

  // Try MediaUpload first
  const mediaUpload = await MediaUpload.findOne({ uploadSessionId });
  if (mediaUpload) {
    return res.status(200).json({
      success: true,
      data: {
        status: mediaUpload.status,
        finalUrl: mediaUpload.finalUrl,
      },
    });
  }

  // Fallback to Lecture
  const lecture = await Lecture.findOne({ uploadSessionId });
  if (lecture) {
    return res.status(200).json({
      success: true,
      data: {
        status: lecture.uploadStatus,
        videoUrl: lecture.videoUrl,
      },
    });
  }

  throw new ApiError("Upload session not found", 404);
});

/**
 * @desc Internal endpoint called by Lambda when an S3 object is created.
 * @input {Request} req - The request containing s3Key in body.
 * @input {Response} res - The response object.
 * @output {Promise<void>} Sends a JSON response confirming upload.
 */
export const confirmUpload = asyncHandler(async (req: Request, res: Response) => {
  const { s3Key } = req.body;
  if (!s3Key) {
    throw new ApiError("s3Key is required", 400);
  }

  // 1. Try Lecture Video
  const lecture = await Lecture.findOneAndUpdate(
    { s3Key, uploadStatus: EUploadStatus.PENDING_UPLOAD },
    { uploadStatus: EUploadStatus.UPLOADED },
    { new: true }
  );

  // console.log("got the request");
  if (lecture) {
    return res.status(200).json({ success: true, message: "Lecture upload confirmed" });
  }

  // 2. Try MediaUpload (Avatar / Course Image)
  const mediaUpload = await MediaUpload.findOneAndUpdate(
    { s3Key, status: EMediaUploadStatus.PENDING_UPLOAD },
    {
      status: EMediaUploadStatus.UPLOADED,
      finalUrl: getPublicUrl(s3Key)
    },
    { new: true }
  );

  if (mediaUpload) {
    // Auto-update the entity
    if (mediaUpload.entityType === "avatar") {
      await User.findByIdAndUpdate(mediaUpload.entityId, { avatarUrl: mediaUpload.finalUrl });
    } else if (mediaUpload.entityType === "course-image") {
      await Course.findByIdAndUpdate(mediaUpload.entityId, { thumbnail: mediaUpload.finalUrl });
    }
    return res.status(200).json({ success: true, message: "Media upload confirmed" });
  }

  // Not found in PENDING_UPLOAD - either already processed, or invalid
  res.status(200).json({ success: true, message: "Ignored or already processed" });
});

/**
 * @desc Internal endpoint called by Python worker to update lecture status (e.g. PROCESSING, READY, FAILED)
 * @input {Request} req - The request containing uploadSessionId or s3Key, and new status details in body.
 * @input {Response} res - The response object.
 * @output {Promise<void>} Sends a JSON response with updated lecture.
 */
export const updateMediaStatus = asyncHandler(async (req: Request, res: Response) => {
  const { uploadSessionId, s3Key, status, videoUrl, duration, error } = req.body;

  if ((!uploadSessionId && !s3Key) || !status) {
    throw new ApiError("uploadSessionId or s3Key, and status are required", 400);
  }

  // Valid states for transitions
  const validStatusValues = Object.values(EUploadStatus);
  if (!validStatusValues.includes(status)) {
    throw new ApiError(`Invalid status: ${status}`, 400);
  }

  let updateFields: any = { uploadStatus: status };

  if (status === EUploadStatus.READY) {
    if (!videoUrl) throw new ApiError("videoUrl is required when setting to READY", 400);
    updateFields.videoUrl = videoUrl;
    if (duration) updateFields.duration = duration;
  }

  const query = uploadSessionId ? { uploadSessionId } : { s3Key };

  const lecture = await Lecture.findOneAndUpdate(
    {
      ...query,
      uploadStatus: { $in: [EUploadStatus.PENDING_UPLOAD, EUploadStatus.UPLOADED, EUploadStatus.PROCESSING] }
    },
    updateFields,
    { new: true }
  );

  if (!lecture) {
    throw new ApiError("Lecture not found or already in terminal state", 404);
  }

  if (error) {
    console.error(`Lecture processing error for ${uploadSessionId || s3Key}:`, error);
  }

  res.status(200).json({
    success: true,
    message: `Status updated to ${status}`,
    data: { lecture }
  });
});
