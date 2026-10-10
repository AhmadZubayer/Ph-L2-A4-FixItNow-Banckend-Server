import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { technicianController } from "./technician.controller";
import { technicianValidation } from "./technician.validation";
import { validateParams } from "../../middlewares/validateParams";

export const technicianRoutes = Router();
export const publicTechnicianRoutes = Router();

technicianRoutes.put(
    "/profile",
    auth(UserRole.TECHNICIAN),
    validateRequest(technicianValidation.updateTechnicianProfileSchema),
    technicianController.updateTechnicianProfile
);

publicTechnicianRoutes.get(
    "/",
    technicianController.getAllTechnicians
);

publicTechnicianRoutes.get(
    "/:id",
    validateParams(technicianValidation.getTechnicianParamsSchema),
    technicianController.getTechnicianById
);