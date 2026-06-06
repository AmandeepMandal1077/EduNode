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

export { courseProgressSchema as courseProgressValidator };
