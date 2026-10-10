import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { serviceController } from "./service.controller";
import { serviceValidation } from "./service.validation";

export const technicianServiceRoutes = Router();

technicianServiceRoutes.post(
    "/",
    auth(UserRole.TECHNICIAN),
    validateRequest(serviceValidation.createServiceSchema),
    serviceController.createService
);