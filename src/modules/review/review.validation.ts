import { z } from "zod";

const createReviewSchema = z.object({
    bookingId: z.uuid("A valid booking ID is required"),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(1, "Comment cannot be empty").optional()
});

export const reviewValidation = {
    createReviewSchema
}