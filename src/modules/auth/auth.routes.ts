import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { authController } from "./auth.controller";
import { authValidation } from "./auth.validation";
import { auth } from "../../middlewares/auth";

export const authRoutes = Router();

authRoutes.post(
    "/register",
    validateRequest(authValidation.registerUserSchema),
    authController.registerUser
);

authRoutes.post(
    "/login",
    validateRequest(authValidation.loginUserSchema),
    authController.loginUser
);

authRoutes.get(
    "/me",
    auth(),
    authController.getMe
);

authRoutes.post(
    "/refresh-token",
    validateRequest(authValidation.refreshTokenSchema),
    authController.refreshToken
);

authRoutes.patch(
    "/me",
    auth(),
    validateRequest(authValidation.updateProfileSchema),
    authController.updateProfile
);