import z from "zod";

export const announcementSchema = z.object({
  message: z
    .string({ error: "Message is required" })
    .trim()
    .min(1, "Message cannot be empty")
    .max(500, "Announcement cannot exceed 500 characters"),
});
