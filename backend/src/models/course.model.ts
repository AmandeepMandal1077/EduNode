import mongoose, { type Document, type Types } from "mongoose";

export enum CourseLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCE = "advance",
}

export interface ICourse {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: CourseLevel;
  price: number;
  thumbnail: string;
  enrolledStudents: {
    student: Types.ObjectId;
    rating?: number;
  }[];
  lectures: Types.ObjectId[];
  instructor: Types.ObjectId;
  announcements: Types.ObjectId[];
  isPublished: boolean;
  totalLectures: number;
  totalDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourseMethods { }
export interface ICourseVirtuals {
  averageRating: number;
}

type TCourseModel = mongoose.Model<
  ICourse,
  {},
  ICourseMethods,
  ICourseVirtuals
>;

type TCourseDoc = mongoose.HydratedDocument<
  ICourse,
  ICourseMethods & ICourseVirtuals
>;
const courseSchema = new mongoose.Schema<
  ICourse,
  TCourseModel,
  ICourseMethods,
  {},
  ICourseVirtuals
>(
  {
    slug: {
      type: String,
      unique: true,
      required: [true, "slug is required"],
    },
    title: {
      type: String,
      required: [true, "title is required"],
      maxLength: [50, "title can be atmost 50 characters long"],
      trim: true,
    },
    subtitle: {
      type: String,
      maxLength: [100, "sub-title can be atmost 100 characters long"],
      required: [true, "description is required"],
      trim: true,
    },
    description: {
      type: String,
      maxLength: [200, "description can be atmost 200 characters long"],
      required: [true, "description is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "category is required"],
      trim: true,
    },
    level: {
      type: String,
      enum: {
        values: Object.values(CourseLevel),
        message: "a course level is required",
      },
      default: CourseLevel.BEGINNER,
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "price must be non-negative"],
    },
    thumbnail: {
      type: String,
      required: [true, "thumbnail is required"],
    },
    enrolledStudents: {
      type: [
        {
          student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          rating: {
            type: Number,
            min: 1,
            max: 5,
          },
        },
      ],
      default: [],
    },
    lectures: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lecture",
        },
      ],
      default: [],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "course instructor is required"],
    },
    announcements: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Announcement",
        },
      ],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    totalLectures: {
      type: Number,
      default: 0,
    },
    totalDuration: {
      type: Number,
      default: 0,
    },
  },
  {
    id: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
courseSchema.index(
  { title: "text", subtitle: "text", description: "text", category: "text" },
  { weights: { title: 10, subtitle: 5, category: 3, description: 1 }, name: "course_search_idx" }
);
courseSchema.index({ instructor: 1 });

/**
 * @desc Updates the totalLectures count before saving the course document.
 * @input None
 * @output None
 */
courseSchema.pre("save", function (this: TCourseDoc) {
  if (this.isModified("lectures") && this.lectures) {
    this.totalLectures = this.lectures.length;
  }
});

/**
 * @desc Generates a URL-friendly slug based on the course title before validation.
 * @input None
 * @output None
 */
courseSchema.pre("validate", function (this: TCourseDoc) {
  if (this.isModified("title")) {
    this.slug = this.title.trim().toLowerCase().replace(/ /g, "-");
  }
});

/**
 * @desc Calculates and returns the average rating of the course from enrolled students.
 * @input None
 * @output {number} The calculated average rating.
 */
courseSchema.virtual("averageRating").get(function (this: TCourseDoc) {
  if (!this.enrolledStudents || this.enrolledStudents.length === 0) return 0;
  const ratedStudents = this.enrolledStudents.filter(
    (student) => student.rating !== undefined,
  );

  if (ratedStudents.length === 0) return 0;

  const totalRating = ratedStudents.reduce(
    (sum, student) => sum + student.rating!,
    0,
  );
  return Math.round((totalRating / ratedStudents.length) * 10) / 10;
});

export const Course = mongoose.model<ICourse, TCourseModel>(
  "Course",
  courseSchema,
);
