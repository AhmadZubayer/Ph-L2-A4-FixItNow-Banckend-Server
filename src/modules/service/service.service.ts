import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";
import { ICreateService } from "./service.interface";
import { ActiveStatus } from "../../../generated/prisma/enums";

const createServiceIntoDB = async (userId: string, payload: ICreateService) => {
    const technicianProfile = await prisma.technicianProfile.findUnique({
        where: {
            userId
        }
    });

    if (!technicianProfile) {
        throw new AppError(httpStatus.BAD_REQUEST, "Create your technician profile first");
    }

    const category = await prisma.category.findFirst({
        where: {
            id: payload.categoryId,
            isActive: true
        }
    });

    if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, "Active category not found");
    }

    const service = await prisma.service.create({
        data: {
            ...payload,
            technicianProfileId: technicianProfile.id
        }
    });

    return service;
}

const getAllServicesFromDB = async () => {
    const services = await prisma.service.findMany({
        where: {
            isActive: true,
            category: {
                isActive: true
            },
            technicianProfile: {
                user: {
                    activeStatus: ActiveStatus.ACTIVE
                }
            }
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            },
            technicianProfile: {
                select: {
                    id: true,
                    location: true,
                    experienceYears: true,
                    user: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    return services;
}

export const serviceService = {
    createServiceIntoDB,
    getAllServicesFromDB
}