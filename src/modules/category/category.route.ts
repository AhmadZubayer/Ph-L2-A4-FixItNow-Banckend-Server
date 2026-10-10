import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
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