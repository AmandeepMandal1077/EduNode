import z from "zod";

export const ratingSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5, "Rating must be between 1 and 5"),
});
