import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";
import { ICreateCategory } from "./category.interface";

const createCategoryIntoDB = async (payload: ICreateCategory) => {
    const isCategoryExist = await prisma.category.findFirst({
        where: {
            OR: [
                { name: payload.name },
                { slug: payload.slug }
            ]
        }
    });

    if (isCategoryExist) {
        throw new AppError(httpStatus.CONFLICT, "Category name or slug already exists");
    }

    const category = await prisma.category.create({
        data: payload
    });

    return category;
}

export const categoryService = {
    createCategoryIntoDB
}