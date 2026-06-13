import mongoose, {
  type Types,
  type HydratedDocument,
} from "mongoose";

export interface ILectureProgress {
  lecture: Types.ObjectId;
  userId: Types.ObjectId;
  isCompleted: boolean;
  lastWatchedPosition: number;
  lastWatched: Date;
}

export interface ICourseProgress {
  user: Types.ObjectId;
  course: Types.ObjectId;
  isCompleted: boolean;
  completionPercentage: number;
  lectureProgress: ILectureProgress[];
  lastAccessed: Date;
}

export interface ICourseProgressMethods {
  updateLastAccessed(): Promise<void>;
}

export interface ICourseProgressVirtuals { }

export type TCourseProgressModel = mongoose.Model<
  ICourseProgress,
  {},
  ICourseProgressMethods,
  ICourseProgressVirtuals
>;

export type TCourseProgressDoc = HydratedDocument<
  ICourseProgress,
  ICourseProgressMethods
>;

const lectureProgressSchema = new mongoose.Schema({
  lecture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecture",
    required: [true, "lecture is required"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "user is required"]
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  lastWatchedPosition: {
    type: Number,
    default: 0,
  },
  lastWatched: {
    type: Date,
    default: Date.now,
  },
});

const courseProgressSchema = new mongoose.Schema<
  ICourseProgress,
  TCourseProgressModel,
  ICourseProgressMethods,
  {},
  ICourseProgressVirtuals
>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "course is required"],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lectureProgress: [lectureProgressSchema],
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

courseProgressSchema.index({
  user: 1,
  course: 1,
});

/**
 * @desc Calculates and updates the completion percentage and isCompleted status before saving.
 * @input None
 * @output None
 */
courseProgressSchema.pre("save", function (this: TCourseProgressDoc) {
  if (this.lectureProgress) {
    this.completionPercentage = Math.round(
      (this.lectureProgress.filter((lecture) => lecture.isCompleted).length /
        this.lectureProgress.length) *
      100,
    );

    this.isCompleted = this.completionPercentage === 100;
  }
});

/**
 * @desc Updates the lastAccessed timestamp for the course progress.
 * @input None
 * @output {Promise<void>} Resolves when the document is saved successfully.
 */
courseProgressSchema.methods.updateLastAccessed = async function (
  this: TCourseProgressDoc,
) {
  this.lastAccessed = new Date(Date.now());
  await this.save({ validateBeforeSave: false });
};

export const CourseProgress = mongoose.model<
  ICourseProgress,
  TCourseProgressModel
>("CourseProgress", courseProgressSchema);
