import { z } from "zod";

const updateTechnicianProfileSchema = z.object({
    bio: z.string().trim().optional(),
    skills: z.array(
        z.string().trim().min(1, "Skill cannot be empty")
    ).min(1, "At least one skill is required"),
    experienceYears: z.number().int().min(0).optional(),
    location: z.string().trim().min(2, "Location must contain at least 2 characters"),
    profilePhoto: z.url().optional()
});

const getTechnicianParamsSchema = z.object({
    id: z.uuid("A valid technician ID is required")
});

const getTechniciansQuerySchema = z.object({
    q: z.string().trim().min(1).max(100).optional(),
    categoryId: z.uuid("A valid category ID is required").optional(),
    serviceId: z.uuid("A valid service ID is required").optional(),
    serviceTitle: z.string().trim().min(1).optional(),
    location: z.string().trim().min(2, "Location must contain at least 2 characters").optional(),
    minRating: z.string().trim().min(1)
        .transform(Number)
        .pipe(z.number().min(0).max(5))
        .optional(),
    minPrice: z.string().trim().regex(/^\d{1,8}(\.\d{1,2})?$/).optional(),
    maxPrice: z.string().trim().regex(/^\d{1,8}(\.\d{1,2})?$/).optional(),
    priceSort: z.enum(["asc", "desc"]).optional(),
    ratingSort: z.enum(["asc", "desc"]).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1)).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(9)).optional()
}).refine(
    filters => !filters.minPrice || !filters.maxPrice ||
        Number(filters.minPrice) <= Number(filters.maxPrice),
    { path: ["maxPrice"], message: "Maximum price must be greater than or equal to minimum price" }
);

export const technicianValidation = {
    updateTechnicianProfileSchema,
    getTechnicianParamsSchema,
    getTechniciansQuerySchema
}
