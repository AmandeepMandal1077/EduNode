import z from "zod";

export const syncPlaybackSchema = z.object({
  lectureId: z.string().length(24, "Invalid lectureId"),
  courseId: z.string().length(24, "Invalid courseId"),
  currentPosition: z.number().min(0, "Position must be non-negative"),
  previousPosition: z.number().min(0, "Position must be non-negative"),
  lectureDuration: z.number().positive("Duration must be positive"),
});

export const lastWatchPositionSchema = z.object({
  lectureId: z.string().length(24, "Invalid lectureId"),
  courseId: z.string().length(24, "Invalid courseId"),
});
