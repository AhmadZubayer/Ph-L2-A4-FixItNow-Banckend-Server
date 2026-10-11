import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { paymentController } from "./payment.controller";
import { paymentValidation } from "./payment.validation";
import { validateParams } from "../../middlewares/validateParams";

export const paymentRoutes = Router();

paymentRoutes.post(
    "/create",
    auth(UserRole.CUSTOMER),
    validateRequest(paymentValidation.createPaymentSchema),
    paymentController.createPayment
);

paymentRoutes.get(
    "/",
    auth(UserRole.CUSTOMER),
    paymentController.getMyPayments
);

paymentRoutes.get(
    "/:id",
    auth(UserRole.CUSTOMER),
    validateParams(paymentValidation.getPaymentParamsSchema),
    paymentController.getPaymentById
);
