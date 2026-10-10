import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { serviceController } from "./service.controller";
import { serviceValidation } from "./service.validation";
import { validateQuery } from "../../middlewares/validateQuery";

export const technicianServiceRoutes = Router();
export const serviceRoutes = Router();

technicianServiceRoutes.post(
    "/",
    auth(UserRole.TECHNICIAN),
    validateRequest(serviceValidation.createServiceSchema),
    serviceController.createService
);

// serviceRoutes.get(
//     "/",
//     serviceController.getAllServices
// );

serviceRoutes.get(
    "/",
    validateQuery(serviceValidation.getServicesQuerySchema),
    serviceController.getAllServices
);