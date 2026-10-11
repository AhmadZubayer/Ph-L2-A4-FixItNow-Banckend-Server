import { z } from "zod";
import { ActiveStatus } from "../../../generated/prisma/enums";

const updateUserStatusParamsSchema = z.object({
    id: z.uuid("A valid user ID is required")
});

const updateUserStatusSchema = z.object({
    activeStatus: z.enum(ActiveStatus)
});

export const adminValidation = {
    updateUserStatusParamsSchema,
    updateUserStatusSchema
}