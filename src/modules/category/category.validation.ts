import { z } from "zod";

const createCategorySchema = z.object({
    name: z.string().trim().min(2, "Name must contain at least 2 characters"),
    slug: z.string().trim().toLowerCase().regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain letters, numbers, and single hyphens"
    ),
    description: z.string().trim().optional()
});

export const categoryValidation = {
    createCategorySchema
}