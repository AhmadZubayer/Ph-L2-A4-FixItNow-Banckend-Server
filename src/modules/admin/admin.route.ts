import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { adminController } from "./admin.controller";
import { validateParams } from "../../middlewares/validateParams";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminValidation } from "./admin.validation";
import { adminServices, approveService } from "./admin-services.controller";

export const adminRoutes = Router();
adminRoutes.get("/services", auth(UserRole.ADMIN), adminServices);
adminRoutes.patch("/services/:id", auth(UserRole.ADMIN), approveService);

adminRoutes.get("/feedbacks", auth(UserRole.ADMIN), adminController.getAllFeedbacks);

adminRoutes.get(
    "/users",
    auth(UserRole.ADMIN),
    adminController.getAllUsers
);

adminRoutes.patch(
    "/users/:id",
    auth(UserRole.ADMIN),
    validateParams(adminValidation.updateUserStatusParamsSchema),
    validateRequest(adminValidation.updateUserStatusSchema),
    adminController.updateUserStatus
);

adminRoutes.get(
    "/bookings",
    auth(UserRole.ADMIN),
    adminController.getAllBookings
);

adminRoutes.get(
    "/payments",
    auth(UserRole.ADMIN),
    adminController.getAllPayments
);
