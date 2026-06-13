import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose, { type HydratedDocument } from "mongoose";


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
  enrolledAt?: Date;
  resetPasswordToken?: string | undefined;
  resetPasswordTokenExpiry?: Date | undefined;
  lastActive?: Date;
}

export interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
  compareResetPasswordToken(token: string): Promise<boolean>;
  getResetPasswordToken(): Promise<string>;
  updateLastActive(): Promise<void>;
}

export interface IUserVirtuals {}

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
    enrolledAt: {
      type: Date,
      default: Date.now,
    },

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

/**
 * @desc Hashes the user password before saving if it has been modified.
 * @input None
 * @output None
 */
userSchema.pre("save", async function (this: TUserDoc) {
  if (!this.isModified("password")) {
    return;
  }

  const hashedPassword = await bcrypt.hash(this.password, 12);
  this.password = hashedPassword;
});

/**
 * @desc Compares a given plain text password with the hashed password.
 * @input {string} password - The plain text password to compare.
 * @output {Promise<boolean>} True if the passwords match, false otherwise.
 */
userSchema.methods.comparePassword = async function (
  this: TUserDoc,
  password: string,
) {
  return await bcrypt.compare(password, this.password);
};

/**
 * @desc Generates and saves a reset password token and expiry time.
 * @input None
 * @output {Promise<string>} The plain text reset password token.
 */
userSchema.methods.getResetPasswordToken = async function (this: TUserDoc) {
  const token = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  this.resetPasswordTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await this.save({ validateBeforeSave: false });
  return token;
};

/**
 * @desc Compares a given plain text token with the hashed reset password token.
 * @input {string} token - The plain text reset password token.
 * @output {Promise<boolean>} True if the tokens match, false otherwise.
 */
userSchema.methods.compareResetPasswordToken = async function (
  this: TUserDoc,
  token: string,
) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  return hashedToken === this.resetPasswordToken;
};

/**
 * @desc Updates the lastActive timestamp for the user.
 * @input None
 * @output {Promise<void>} Resolves when the document is saved successfully.
 */
userSchema.methods.updateLastActive = async function (this: TUserDoc) {
  this.lastActive = new Date(Date.now());
  await this.save({ validateBeforeSave: false });
};



export const User = mongoose.model<IUser, TUserModel>("User", userSchema);
