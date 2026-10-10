import { z } from "zod";

const createServiceSchema = z.object({
    title: z.string().trim().min(2, "Title must contain at least 2 characters"),
    description: z.string().trim().min(1, "Description is required"),
    price: z.string().trim()
        .regex(/^\d{1,8}(\.\d{1,2})?$/, "Price must have at most 2 decimal places")
        .refine(value => Number(value) > 0, {
            message: "Price must be greater than zero"
        }),
    durationMinutes: z.number().int().positive(),
    categoryId: z.uuid("A valid category ID is required")
});

const filterPriceSchema = z.string().trim().regex(
    /^\d{1,8}(\.\d{1,2})?$/,
    "Price must have at most 2 decimal places"
);

const getServicesQuerySchema = z.object({
    categoryId: z.uuid("A valid category ID is required").optional(),
    location: z.string().trim().min(2, "Location must contain at least 2 characters").optional(),
    minPrice: filterPriceSchema.optional(),
    maxPrice: filterPriceSchema.optional(),
    minRating: z.string().trim().min(1)
        .transform(Number)
        .pipe(z.number().min(0).max(5))
        .optional()
}).refine(
    filters => !filters.minPrice || !filters.maxPrice ||
        Number(filters.minPrice) <= Number(filters.maxPrice),
    {
        path: ["maxPrice"],
        message: "Maximum price must be greater than or equal to minimum price"
    }
);

export const serviceValidation = {
    createServiceSchema,
    getServicesQuerySchema
}