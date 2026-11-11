import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { serviceController } from "./service.controller";
import { serviceValidation } from "./service.validation";
import { validateQuery } from "../../middlewares/validateQuery";
import { validateParams } from "../../middlewares/validateParams";
import { serviceSuggestions } from "../technician/workspace.handlers";

export const technicianServiceRoutes = Router();
export const serviceRoutes = Router();
technicianServiceRoutes.get("/suggestions", auth(UserRole.TECHNICIAN), serviceSuggestions);

technicianServiceRoutes.post(
    "/",
    auth(UserRole.TECHNICIAN),
    validateRequest(serviceValidation.createServiceSchema),
    serviceController.createService
);

technicianServiceRoutes.patch(
    "/:id",
    auth(UserRole.TECHNICIAN),
    validateParams(serviceValidation.serviceParamsSchema),
    validateRequest(serviceValidation.updateServiceSchema),
    serviceController.updateService
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
