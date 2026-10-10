import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { authController } from "./auth.controller";
import { authValidation } from "./auth.validation";

export const authRoutes = Router();

authRoutes.post(
    "/register",
    validateRequest(authValidation.registerUserSchema),
    authController.registerUser
);