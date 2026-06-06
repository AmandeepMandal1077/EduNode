import z from "zod";
import { Role } from "../models/user.model.js";

const userSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(3, { error: "Name must be at least 3 characters long" })
    .max(50, {
      error: "Name must be at most 50 characters long",
    }),
  email: z
    .email({ error: "email is required" })
    .trim()
    .lowercase({ error: "email must be lowercase" }),
  password: z
    .string({ error: "Password is required" })
    .trim()
    .min(8, { error: "Password must be at least 8 characters long" })
    .max(20, { error: "Password must be at most 20 characters long" }),
  role: z
    .enum(Role, { error: "Invalid role" })
    .optional()
    .default(Role.STUDENT),
  avatar: z.string().optional(),
  bio: z
    .string()
    .max(300, { error: "Bio must be at most 300 characters long" })
    .optional(),
  enrolledCourses: z.array(z.string()).optional(),
  enrolledAt: z.date().optional(),
  createdCourses: z.array(z.string()).optional(),
  resetPasswordToken: z.string().optional(),
  resetPasswordTokenExpiry: z.date().optional(),
  lastActive: z.date().optional(),
});

const signupSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(3, { error: "Name must be at least 3 characters long" })
    .max(50, { error: "Name must be at most 50 characters long" }),
  email: z.email({ error: "Invalid email address" }).trim(),
  password: z
    .string({ error: "Password is required" })
    .trim()
    .min(8, { error: "Password must be at least 8 characters long" })
    .max(20, { error: "Password must be at most 20 characters long" }),
});

const signinSchema = z.object({
  email: z.email({ error: "Invalid email address" }).trim(),
  password: z
    .string({ error: "Password is required" })
    .trim()
    .min(8, { error: "Password must be at least 8 characters long" })
    .max(20, { error: "Password must be at most 20 characters long" }),
});

const changePasswordSchema = z.object({
  password: z
    .string({ error: "Password is required" })
    .trim()
    .min(8, { error: "Password must be at least 8 characters long" })
    .max(20, { error: "Password must be at most 20 characters long" }),
});

export {
  signupSchema as signupValidator,
  signinSchema as signinValidator,
  userSchema as userValidator,
  changePasswordSchema as changePasswordValidator,
};
