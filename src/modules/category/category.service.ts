import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";
import { ICreateCategory } from "./category.interface";
import { Prisma } from "../../../generated/prisma/client";

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

const getAllCategoriesFromDB = async () => {
    const categories = await prisma.category.findMany({
        where: {
            isActive: true
        },
        orderBy: {
            name: "asc"
        }
    });

    return categories;
}

const getAllCategoriesForAdminFromDB = async () => {
    const categories = await prisma.category.findMany({
        orderBy: {
            name: "asc"
        }
    });

    return categories;
}

const updateCategoryIntoDB = async (id: string, payload: Partial<ICreateCategory> & { isActive?: boolean }) => {
    const duplicate = await prisma.category.findFirst({
        where: {
            id: { not: id },
            OR: [
                ...(payload.name ? [{ name: payload.name }] : []),
                ...(payload.slug ? [{ slug: payload.slug }] : [])
            ]
        }
    });
    if (duplicate) throw new AppError(httpStatus.CONFLICT, "Category name or slug already exists");
    try {
        return await prisma.category.update({ where: { id }, data: payload });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            throw new AppError(httpStatus.NOT_FOUND, "Category not found");
        }
        throw error;
    }
}

export const categoryService = {
    createCategoryIntoDB,
    getAllCategoriesFromDB,
    getAllCategoriesForAdminFromDB,
    updateCategoryIntoDB
}
