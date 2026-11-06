import cron from "node-cron";
import { Lecture, EUploadStatus } from "../models/lecture.model.js";
import { MediaUpload, EMediaUploadStatus } from "../models/mediaUpload.model.js";
import { getStorage } from "../storage/index.js";
import debug from "../utils/debug.js";

// Run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  try {
    const now = new Date();

    // 1. Expire Lectures
    // Lean reads the legacy field that no longer exists in the schema.
    const expiredLectures = await Lecture.find({
      uploadStatus: EUploadStatus.PENDING_UPLOAD,
      presignedUrlExpiresAt: { $lt: now },
    }).lean();

    for (const lecture of expiredLectures) {
      const result = await Lecture.updateOne(
        { _id: lecture._id, uploadStatus: EUploadStatus.PENDING_UPLOAD },
        { $set: { uploadStatus: EUploadStatus.EXPIRED } },
      );
      if (result.modifiedCount === 0) continue;
      // Optionally try to delete from storage in case it uploaded but the trigger failed.
      const storageKey =
        lecture.storageKey ||
        (lecture as typeof lecture & { s3Key?: string }).s3Key;
      if (storageKey) await getStorage().deleteObject(storageKey);
    }

    if (expiredLectures.length > 0) {
      debug(`Expired ${expiredLectures.length} pending lecture uploads`);
    }

    // 2. Expire MediaUploads
    const expiredMedia = await MediaUpload.find({
      status: EMediaUploadStatus.PENDING_UPLOAD,
      presignedUrlExpiresAt: { $lt: now },
    }).lean();

    for (const media of expiredMedia) {
      const result = await MediaUpload.updateOne(
        { _id: media._id, status: EMediaUploadStatus.PENDING_UPLOAD },
        { $set: { status: EMediaUploadStatus.EXPIRED } },
      );
      if (result.modifiedCount === 0) continue;
      const storageKey =
        media.storageKey ||
        (media as typeof media & { s3Key?: string }).s3Key;
      if (storageKey) await getStorage().deleteObject(storageKey);
    }

    if (expiredMedia.length > 0) {
      debug(`Expired ${expiredMedia.length} pending media uploads`);
    }
  } catch (error) {
    debug("Error in expireUploads cron job:", error);
  }
});
