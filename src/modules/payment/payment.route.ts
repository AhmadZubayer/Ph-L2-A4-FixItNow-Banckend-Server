import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { paymentController } from "./payment.controller";
import { paymentValidation } from "./payment.validation";

export const paymentRoutes = Router();

paymentRoutes.post(
    "/create",
    auth(UserRole.CUSTOMER),
    validateRequest(paymentValidation.createPaymentSchema),
    paymentController.createPayment
);

