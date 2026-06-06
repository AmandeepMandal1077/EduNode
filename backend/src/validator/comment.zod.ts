import { z } from "zod";

const commentSchema = z.object({
  courseId: z.string({ error: "courseId is required" }),
  lectureId: z.string({ error: "lectureId is required" }),
  content: z
    .string({ error: "content is required" })
    .trim()
    .min(1, {
      message: "content must be at least 1 character long",
    })
    .max(200, {
      message: "content must be at most 200 characters long",
    }),
  parentCommentId: z.string().optional(),
});

export { commentSchema as commentValidator };
