import mongoose, { type HydratedDocument } from "mongoose";

export interface ILecture {
  title: string;
  slug: string;
  courseId: mongoose.Types.ObjectId;
  description: string;
  videoUrl: string;
  duration?: number;
  isPreview?: boolean;
  publicId: string;
  order?: number;
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
      required: [true, "video is required"],
    },
    duration: {
      type: Number,
      default: 0,
    },
    isPreview: {
      type: Boolean,
      default: true,
    },
    publicId: {
      type: String,
      required: [true, "public id is required for management"],
    },
    order: {
      type: Number,
      // required: [true, "order is required"],
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

lectureSchema.pre("validate", function (this: TLectureDoc) {
  if (this.isModified("title")) {
    this.slug = this.title.trim().toLowerCase().replace(/ /g, "-");
  }
});

lectureSchema.pre("save", function (this: TLectureDoc) {
  if (this.duration) {
    this.duration = Math.round(this.duration * 100) / 100;
  }
  return;
});

export const Lecture = mongoose.model<ILecture, TLectureModel>(
  "Lecture",
  lectureSchema,
);
