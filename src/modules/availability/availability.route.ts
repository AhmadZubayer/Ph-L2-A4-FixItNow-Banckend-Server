import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { availabilityController } from "./availability.controller";
import { availabilityValidation } from "./availability.validation";

export const availabilityRoutes = Router();

availabilityRoutes.put(
    "/",
    auth(UserRole.TECHNICIAN),
    validateRequest(availabilityValidation.setAvailabilitySchema),
    availabilityController.setAvailability
);