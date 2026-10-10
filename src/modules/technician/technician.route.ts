import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { technicianController } from "./technician.controller";
import { technicianValidation } from "./technician.validation";
import { validateParams } from "../../middlewares/validateParams";
import { validateQuery } from "../../middlewares/validateQuery";

export const technicianRoutes = Router();
export const publicTechnicianRoutes = Router();

technicianRoutes.put(
    "/profile",
    auth(UserRole.TECHNICIAN),
    validateRequest(technicianValidation.updateTechnicianProfileSchema),
    technicianController.updateTechnicianProfile
);

// publicTechnicianRoutes.get(
//     "/",
//     technicianController.getAllTechnicians
// );

publicTechnicianRoutes.get(
    "/:id",
    validateParams(technicianValidation.getTechnicianParamsSchema),
    technicianController.getTechnicianById
);

publicTechnicianRoutes.get(
    "/",
    validateQuery(technicianValidation.getTechniciansQuerySchema),
    technicianController.getAllTechnicians
);