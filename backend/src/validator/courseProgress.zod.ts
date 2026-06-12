import z from "zod";

const lectureProgressSchema = z.object({
  lecture: z.string({ error: "lectureId is required" }),
  isCompleted: z.boolean().default(false),
  watchTime: z.number().default(0),
  lastWatched: z.date().default(() => new Date()),
});

export const courseProgressSchema = z.object({
  user: z.string({ error: "userId is required" }),
  course: z.string({ error: "courseId is required" }),
  isCompleted: z.boolean().default(false),
  completionPercentage: z.number().min(0).max(100).default(0),
  lectureProgress: z.array(lectureProgressSchema).optional(),
  lastAccessed: z.date().default(() => new Date()),
});

export const updateLectureProgressSchema = z.object({
  isCompleted: z.boolean().optional(),
  watchTime: z.number().min(0).optional(),
  lastWatchedPosition: z.number().min(0).optional(),
  lastWatched: z.string().datetime().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one progress field is required",
});

export { courseProgressSchema as courseProgressValidator };

