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

export const technicianValidation = {
    updateTechnicianProfileSchema,
    getTechnicianParamsSchema
}