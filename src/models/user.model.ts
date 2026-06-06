import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose, { Types, type HydratedDocument } from "mongoose";

//TODO: Remove role field to a new model, as an instructor could be a student too
export enum Role {
  STUDENT = "student",
  INSTRUCTOR = "instructor",
  ADMIN = "admin",
}

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: Role;
  avatar?: string;
  bio?: string;
  enrolledCourses?: {
    course: Types.ObjectId;
  }[];
  enrolledAt?: Date;
  createdCourses?: {
    course: Types.ObjectId;
  }[];
  resetPasswordToken?: string;
  resetPasswordTokenExpiry?: Date;
  lastActive?: Date;
}

export interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
  compareResetPasswordToken(token: string): Promise<boolean>;
  getResetPasswordToken(): Promise<string>;
  updateLastActive(): Promise<void>;
}

export interface IUserVirtuals {
  totalEnrolledCourses: number;
}

export type TUserModel = mongoose.Model<IUser, {}, IUserMethods, IUserVirtuals>;
type TUserDoc = HydratedDocument<IUser, IUserMethods & IUserVirtuals>;

const userSchema = new mongoose.Schema<
  IUser,
  TUserModel,
  IUserMethods,
  {},
  IUserVirtuals
>(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "name is required"],
      maxLength: [50, "name can be atmost 50 character long"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
      minLength: [8, "Password must be atleast 8 characters long"],
      maxLength: [20, "Password must be atmost 20 characters long"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: Object.values(Role),
        message: "Please select a valid role",
      },
      default: Role.STUDENT,
    },
    avatar: {
      type: String,
      default: "default.png",
    },
    bio: {
      type: String,
      maxLength: [200, "bio can be atmost 200 characters long"],
    },
    enrolledCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
      },
    ],
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    createdCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
      },
    ],

    resetPasswordToken: {
      type: String,
    },
    resetPasswordTokenExpiry: {
      type: Date,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//hooks
userSchema.pre("save", async function (this: TUserDoc) {
  if (!this.isModified("password")) {
    return;
  }

  const hashedPassword = await bcrypt.hash(this.password, 12);
  this.password = hashedPassword;
});

//methods
userSchema.methods.comparePassword = async function (
  this: TUserDoc,
  password: string,
) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.getResetPasswordToken = async function (this: TUserDoc) {
  const token = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  this.resetPasswordTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10min
  await this.save({ validateBeforeSave: false });
  return token;
};

userSchema.methods.compareResetPasswordToken = async function (
  this: TUserDoc,
  token: string,
) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  return hashedToken === this.resetPasswordToken;
};

userSchema.methods.updateLastActive = async function (this: TUserDoc) {
  this.lastActive = new Date(Date.now());
  await this.save({ validateBeforeSave: false });
};

//virtuals
userSchema.virtual("totalEnrolledCourses").get(function (this: TUserDoc) {
  return this?.enrolledCourses?.length || 0;
});

export const User = mongoose.model<IUser, TUserModel>("User", userSchema);
