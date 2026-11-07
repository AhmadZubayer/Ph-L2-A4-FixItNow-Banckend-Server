import { z } from "zod";

const createCategorySchema = z.object({
    name: z.string().trim().min(2, "Name must contain at least 2 characters"),
    slug: z.string().trim().toLowerCase().regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain letters, numbers, and single hyphens"
    ),
    description: z.string().trim().optional()
});

const updateCategorySchema = createCategorySchema.partial().extend({
    isActive: z.boolean().optional()
}).refine((value) => Object.keys(value).length > 0, "At least one field is required");

const categoryParamsSchema = z.object({ id: z.uuid("A valid category ID is required") });

export const categoryValidation = {
    createCategorySchema,
    updateCategorySchema,
    categoryParamsSchema
}
