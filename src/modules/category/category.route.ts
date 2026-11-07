import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { validateParams } from "../../middlewares/validateParams";
import { categoryController } from "./category.controller";
import { categoryValidation } from "./category.validation";

export const adminCategoryRoutes = Router();
export const categoryRoutes = Router();

adminCategoryRoutes.post(
    "/",
    auth(UserRole.ADMIN),
    validateRequest(categoryValidation.createCategorySchema),
    categoryController.createCategory
);

categoryRoutes.get(
    "/",
    categoryController.getAllCategories
);

adminCategoryRoutes.get(
    "/",
    auth(UserRole.ADMIN),
    categoryController.getAllCategoriesForAdmin
);

adminCategoryRoutes.patch(
    "/:id",
    auth(UserRole.ADMIN),
    validateParams(categoryValidation.categoryParamsSchema),
    validateRequest(categoryValidation.updateCategorySchema),
    categoryController.updateCategory
);
