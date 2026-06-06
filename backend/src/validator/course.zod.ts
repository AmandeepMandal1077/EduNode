import z from "zod";
import { CourseLevel } from "../models/course.model.js";

export const courseSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(1, { error: "Title is required" })
    .max(50, { error: "Title can be at most 50 characters long" }),
  subtitle: z
    .string({ error: "Subtitle is required" })
    .trim()
    .min(1, { error: "Subtitle is required" })
    .max(100, { error: "Subtitle can be at most 100 characters long" }),
  description: z
    .string({ error: "Description is required" })
    .trim()
    .min(1, { error: "Description is required" })
    .max(200, { error: "Description can be at most 200 characters long" }),
  category: z
    .string({ error: "Category is required" })
    .trim()
    .min(1, { error: "Category is required" }),
  level: z.enum(CourseLevel).optional().default(CourseLevel.BEGINNER),
  price: z.coerce
    .number()
    .int({ error: "Price must be an integer" })
    .min(0, { error: "Price must be non-negative" })
    .default(0),
  thumbnail: z.string().min(1, { error: "Thumbnail is required" }).optional(),
  enrolledStudents: z
    .array(
      z.object({
        student: z.string({ error: "Student reference is required" }),
        rating: z.number().min(1).max(5).optional(),
      }),
    )
    .optional(),
  lectures: z
    .array(
      z.object({
        lecture: z.string({ error: "Lecture reference is required" }),
      }),
    )
    .optional(),
  isPublished: z.boolean().default(false),
  totalLectures: z.number().default(0),
  totalDuration: z.number().default(0),
});

export { courseSchema as courseValidator };
