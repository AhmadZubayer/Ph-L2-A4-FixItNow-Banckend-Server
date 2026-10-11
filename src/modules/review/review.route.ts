import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { reviewController } from "./review.controller";
import { reviewValidation } from "./review.validation";

export const reviewRoutes = Router();

reviewRoutes.post(
    "/",
    auth(UserRole.CUSTOMER),
    validateRequest(reviewValidation.createReviewSchema),
    reviewController.createReview
);