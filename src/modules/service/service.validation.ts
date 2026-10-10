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

export const serviceValidation = {
    createServiceSchema
}