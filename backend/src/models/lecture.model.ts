import mongoose, { type HydratedDocument } from "mongoose";

export enum EUploadStatus {
  PENDING_UPLOAD = "PENDING_UPLOAD",
  UPLOADED = "UPLOADED",
  PROCESSING = "PROCESSING",
  READY = "READY",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
}

export interface ILecture {
  title: string;
  slug: string;
  courseId: mongoose.Types.ObjectId;
  description: string;
  videoUrl: string;
  duration?: number;
  isPreview?: boolean;
  s3Key: string;
  uploadSessionId: string;
  presignedUrlExpiresAt?: Date;
  order?: number;
  uploadStatus: EUploadStatus;
}

export interface ILectureMethods { }
export interface ILectureVirtuals { }

export type TLectureModel = mongoose.Model<
  ILecture,
  {},
  ILectureMethods,
  ILectureVirtuals
>;
export type TLectureDoc = HydratedDocument<ILecture, ILectureMethods>;

const lectureSchema = new mongoose.Schema<
  ILecture,
  TLectureModel,
  ILectureMethods,
  {},
  ILectureVirtuals
>(
  {
    title: {
      type: String,
      maxLength: [50, "title length can be atmost 50 characters long"],
      trim: true,
      required: [true, "title is required"],
    },
    slug: {
      type: String,
      required: [true, "slug is required"],
      trim: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "course id is required"],
    },
    description: {
      type: String,
      maxLength: [100, "description length can be atmost 100 characters long"],
      trim: true,
      required: [true, "description is required"],
    },
    videoUrl: {
      type: String,
      default: "",
    },
    duration: {
      type: Number,
      default: 0,
    },
    isPreview: {
      type: Boolean,
      default: true,
    },
    s3Key: {
      type: String,
      required: [true, "S3 key is required"],
    },
    uploadSessionId: {
      type: String,
      required: [true, "Upload session ID is required"],
      unique: true,
    },
    presignedUrlExpiresAt: {
      type: Date,
    },
    order: {
      type: Number,
    },
    uploadStatus: {
      type: String,
      enum: EUploadStatus,
      default: EUploadStatus.PENDING_UPLOAD,
    },
  },
  {
    id: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

lectureSchema.index({ courseId: 1, slug: 1 }, { unique: true });

/**
 * @desc Generates a slug from the lecture title before validation.
 * @input None
 * @output None
 */
lectureSchema.pre("validate", function (this: TLectureDoc) {
  if (this.isModified("title")) {
    this.slug = this.title.trim().toLowerCase().replace(/ /g, "-");
  }
});

/**
 * @desc Rounds the lecture duration to two decimal places before saving.
 * @input None
 * @output None
 */
lectureSchema.pre("save", function (this: TLectureDoc) {
  if (this.duration) {
    this.duration = Math.round(this.duration);
  }
  return;
});

export const Lecture = mongoose.model<ILecture, TLectureModel>(
  "Lecture",
  lectureSchema,
);
