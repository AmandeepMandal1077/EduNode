import cron from "node-cron";
import { Lecture, EUploadStatus } from "../models/lecture.model.js";
import { MediaUpload, EMediaUploadStatus } from "../models/mediaUpload.model.js";
import { deleteS3Object } from "../utils/s3.js";

// Run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  try {
    const now = new Date();

    // 1. Expire Lectures
    const expiredLectures = await Lecture.find({
      uploadStatus: EUploadStatus.PENDING_UPLOAD,
      presignedUrlExpiresAt: { $lt: now },
    });

    for (const lecture of expiredLectures) {
      lecture.uploadStatus = EUploadStatus.EXPIRED;
      await lecture.save();
      // Optionally try to delete from S3 just in case it uploaded but Lambda failed
      await deleteS3Object(lecture.s3Key);
    }

    if (expiredLectures.length > 0) {
      console.log(`Expired ${expiredLectures.length} pending lecture uploads`);
    }

    // 2. Expire MediaUploads
    const expiredMedia = await MediaUpload.find({
      status: EMediaUploadStatus.PENDING_UPLOAD,
      presignedUrlExpiresAt: { $lt: now },
    });

    for (const media of expiredMedia) {
      media.status = EMediaUploadStatus.EXPIRED;
      await media.save();
      await deleteS3Object(media.s3Key);
    }

    if (expiredMedia.length > 0) {
      console.log(`Expired ${expiredMedia.length} pending media uploads`);
    }
  } catch (error) {
    console.error("Error in expireUploads cron job:", error);
  }
});
