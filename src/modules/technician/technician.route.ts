import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { technicianController } from "./technician.controller";
import { technicianValidation } from "./technician.validation";

export const technicianRoutes = Router();

technicianRoutes.put(
    "/profile",
    auth(UserRole.TECHNICIAN),
    validateRequest(technicianValidation.updateTechnicianProfileSchema),
    technicianController.updateTechnicianProfile
);