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
    categoryId: z.uuid("A valid category ID is required").optional(),
    location: z.string().trim().min(2, "Location must contain at least 2 characters").optional(),
    minRating: z.string().trim().min(1)
        .transform(Number)
        .pipe(z.number().min(0).max(5))
        .optional()
});

export const technicianValidation = {
    updateTechnicianProfileSchema,
    getTechnicianParamsSchema,
    getTechniciansQuerySchema
}