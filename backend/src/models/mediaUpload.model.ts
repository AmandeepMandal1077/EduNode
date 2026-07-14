import mongoose, { type HydratedDocument } from "mongoose";

export enum EMediaUploadStatus {
  PENDING_UPLOAD = "PENDING_UPLOAD",
  UPLOADED = "UPLOADED",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
}

export interface IMediaUpload {
  uploadSessionId: string;
  userId: mongoose.Types.ObjectId;
  entityType: "avatar" | "course-image";
  entityId: string;
  s3Key: string;
  status: EMediaUploadStatus;
  presignedUrlExpiresAt: Date;
  finalUrl?: string;
}

export interface IMediaUploadMethods {}
export interface IMediaUploadVirtuals {}

export type TMediaUploadModel = mongoose.Model<
  IMediaUpload,
  {},
  IMediaUploadMethods,
  IMediaUploadVirtuals
>;

export type TMediaUploadDoc = HydratedDocument<IMediaUpload, IMediaUploadMethods>;

const mediaUploadSchema = new mongoose.Schema<
  IMediaUpload,
  TMediaUploadModel,
  IMediaUploadMethods,
  {},
  IMediaUploadVirtuals
>(
  {
    uploadSessionId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    entityType: {
      type: String,
      enum: ["avatar", "course-image"],
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: EMediaUploadStatus,
      default: EMediaUploadStatus.PENDING_UPLOAD,
    },
    presignedUrlExpiresAt: {
      type: Date,
      required: true,
    },
    finalUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

mediaUploadSchema.index({ uploadSessionId: 1 });
mediaUploadSchema.index({ entityType: 1, entityId: 1 });
mediaUploadSchema.index({ status: 1, presignedUrlExpiresAt: 1 });

export const MediaUpload = mongoose.model<IMediaUpload, TMediaUploadModel>(
  "MediaUpload",
  mediaUploadSchema
);
