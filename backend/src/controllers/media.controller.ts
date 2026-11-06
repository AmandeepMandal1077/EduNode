import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asynchandler.js";
import { getStorage } from "../storage/index.js";
import { Lecture, EUploadStatus } from "../models/lecture.model.js";
import {
  MediaUpload,
  EMediaUploadStatus,
} from "../models/mediaUpload.model.js";
import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { ApiError } from "../utils/apiError.js";
import { v4 as uuidv4 } from "uuid";
import type { AuthenticatedRequest } from "../types/user.js";
import debug from "../utils/debug.js";
import mongoose from "mongoose";

/**
 * @desc Creates a presigned upload URL and tracks the pending upload session.
 * @input {AuthenticatedRequest} req - The request containing upload details (type, entityId, fileName, contentType).
 * @input {Response} res - The response object.
 * @output {Promise<void>} Sends a JSON response with presigned URL and uploadSessionId.
 */
export const createUploadSession = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { type, entityId, fileName, contentType } = req.body;
    const userId = req.userId;

    if (!type || !entityId || !fileName || !contentType) {
      throw new ApiError(
        "type, entityId, fileName, and contentType are required",
        400,
      );
    }

    const uploadSessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    let storageKey = "";

    if (type === "avatar") {
      if (entityId !== userId) {
        throw new ApiError("Unauthorized", 403);
      }
      storageKey = `root/avatars/users/${userId}/${Date.now()}_${fileName}`;

      // Create MediaUpload
      await MediaUpload.create({
        uploadSessionId,
        userId: new mongoose.Types.ObjectId(userId),
        entityType: "avatar",
        entityId,
        storageKey,
        status: EMediaUploadStatus.PENDING_UPLOAD,
        presignedUrlExpiresAt: expiresAt,
      });
    } else if (type === "course-image") {
      // Verify course ownership
      const course = await Course.findById(entityId);
      if (!course) throw new ApiError("Course not found", 404);
      if (course.instructor.toString() !== userId)
        throw new ApiError("Unauthorized", 403);

      storageKey = `root/courses/${entityId}/images/${Date.now()}_${fileName}`;

      await MediaUpload.create({
        uploadSessionId,
        userId: new mongoose.Types.ObjectId(userId),
        entityType: "course-image",
        entityId,
        storageKey,
        status: EMediaUploadStatus.PENDING_UPLOAD,
        presignedUrlExpiresAt: expiresAt,
      });
    } else if (type === "lecture-video") {
      throw new ApiError(
        "Use /api/v1/course/:courseId/lectures to add a lecture",
        400,
      );
    } else {
      throw new ApiError("Invalid upload type", 400);
    }

    const uploadTarget = await getStorage().createUploadTarget(
      storageKey,
      contentType,
      900,
    );

    res.status(200).json({
      success: true,
      data: {
        uploadSessionId,
        storageKey,
        presignedUrl: uploadTarget.url,
        uploadHeaders: uploadTarget.headers,
        expiresAt,
      },
    });
  },
);

/**
 * @desc Poll the status of an upload session.
 * @input {AuthenticatedRequest} req - The request containing uploadSessionId as route parameter.
 * @input {Response} res - The response object.
 * @output {Promise<void>} Sends a JSON response with the session's upload status.
 */
export const getUploadStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  },
);

/**
 * @desc Internal endpoint called by the storage event trigger when an object is created.
 * @input {Request} req - The request containing storageKey in body.
 * @input {Response} res - The response object.
 * @output {Promise<void>} Sends a JSON response confirming upload.
 */
export const confirmUpload = asyncHandler(
  async (req: Request, res: Response) => {
    // Accept the legacy field while older deployed triggers drain.
    const storageKey = req.body.storageKey || req.body.s3Key;
    if (!storageKey) {
      throw new ApiError("storageKey is required", 400);
    }

    // 1. Try Lecture Video. The legacy field is read for one release.
    const lecture = await Lecture.findOneAndUpdate(
      {
        $or: [{ storageKey }, { s3Key: storageKey }],
        uploadStatus: EUploadStatus.PENDING_UPLOAD,
      },
      { uploadStatus: EUploadStatus.UPLOADED },
      { new: true },
    );

    if (lecture) {
      return res
        .status(200)
        .json({ success: true, message: "Lecture upload confirmed" });
    }

    // 2. Try MediaUpload (Avatar / Course Image). Legacy field read too.
    const mediaUpload = await MediaUpload.findOneAndUpdate(
      {
        $or: [{ storageKey }, { s3Key: storageKey }],
        status: EMediaUploadStatus.PENDING_UPLOAD,
      },
      {
        status: EMediaUploadStatus.UPLOADED,
        finalUrl: getStorage().getPublicUrl(storageKey),
      },
      { new: true },
    );

    if (mediaUpload) {
      // Auto-update the entity
      if (mediaUpload.entityType === "avatar") {
        await User.findByIdAndUpdate(mediaUpload.entityId, {
          avatar: mediaUpload.finalUrl,
        });
      } else if (mediaUpload.entityType === "course-image") {
        await Course.findByIdAndUpdate(mediaUpload.entityId, {
          thumbnail: mediaUpload.finalUrl,
        });
      }
      // Thumbnail and instructor avatar both appear in the cached course list.
      await invalidatePublishedCoursesInCache();
      return res
        .status(200)
        .json({ success: true, message: "Media upload confirmed" });
    }

    // Not found in PENDING_UPLOAD - either already processed, or invalid
    res
      .status(200)
      .json({ success: true, message: "Ignored or already processed" });
  },
);

/**
 * @desc Internal endpoint called by the media worker to update lecture status (e.g. PROCESSING, READY, FAILED)
 * @input {Request} req - The request containing uploadSessionId or storageKey, and new status details in body.
 * @input {Response} res - The response object.
 * @output {Promise<void>} Sends a JSON response with updated lecture.
 */
export const updateMediaStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { uploadSessionId, status, videoUrl, duration, error } = req.body;
    // Accept the legacy field while older deployed workers drain.
    const storageKey = req.body.storageKey || req.body.s3Key;

    if ((!uploadSessionId && !storageKey) || !status) {
      throw new ApiError(
        "uploadSessionId or storageKey, and status are required",
        400,
      );
    }

    // Valid states for transitions
    const validStatusValues = Object.values(EUploadStatus);
    if (!validStatusValues.includes(status)) {
      throw new ApiError(`Invalid status: ${status}`, 400);
    }

    let updateFields: any = { uploadStatus: status };

    if (status === EUploadStatus.READY) {
      if (!videoUrl)
        throw new ApiError("videoUrl is required when setting to READY", 400);
      updateFields.videoUrl = videoUrl;
      if (duration) updateFields.duration = duration;
    }

    const query = uploadSessionId
      ? { uploadSessionId }
      : { $or: [{ storageKey }, { s3Key: storageKey }] };

    const lecture = await Lecture.findOneAndUpdate(
      {
        ...query,
        uploadStatus: {
          $in: [
            EUploadStatus.PENDING_UPLOAD,
            EUploadStatus.UPLOADED,
            EUploadStatus.PROCESSING,
          ],
        },
      },
      updateFields,
      { new: true },
    );

    if (!lecture) {
      throw new ApiError("Lecture not found or already in terminal state", 404);
    }

    if (status === EUploadStatus.READY && duration) {
      await Course.findByIdAndUpdate(lecture.courseId, {
        $inc: { totalDuration: Math.round(duration) },
      });
      await invalidatePublishedCoursesInCache();
    }

    if (error) {
      debug(
        `Lecture processing error for ${uploadSessionId || storageKey}:`,
        error,
      );
    }

    res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      data: { lecture },
    });
  },
);
