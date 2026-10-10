import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";
import { ICreateService, IServiceFilters } from "./service.interface";
import { ActiveStatus } from "../../../generated/prisma/enums";
import { Prisma } from "../../../generated/prisma/client";

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

const getAllServicesFromDB = async (filters: IServiceFilters = {}) => {
    // Start with services that are visible to the public.
    const where: Prisma.ServiceWhereInput = {
        isActive: true,
        category: {
            isActive: true
        },
        technicianProfile: {
            user: {
                activeStatus: ActiveStatus.ACTIVE
            }
        }
    };

    // Add a category condition if one was requested.
    if (filters.categoryId) {
        where.category = {
            id: filters.categoryId,
            isActive: true
        };
    }

    // Match part of a location, ignoring uppercase and lowercase letters.
    if (filters.location) {
        where.technicianProfile = {
            location: {
                contains: filters.location,
                mode: "insensitive"
            },
            user: {
                activeStatus: ActiveStatus.ACTIVE
            }
        };
    }

    // Keep services within the requested price range.
    if (filters.minPrice || filters.maxPrice) {
        where.price = {
            gte: filters.minPrice,
            lte: filters.maxPrice
        };
    }

    // Get matching services with the public category and technician details.
    const services = await prisma.service.findMany({
        where,
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

        if (services.length === 0) {
        return [];
    }

    // Calculate ratings only for technicians in this service list.
    const ratings = await prisma.review.groupBy({
        by: ["technicianProfileId"],
        where: {
            technicianProfileId: {
                in: services.map(service => service.technicianProfileId)
            }
        },
        _avg: {
            rating: true
        },
        _count: {
            rating: true
        }
    });


    // Store each technician's rating so we can find it by profile ID.
    const ratingMap = new Map<string, { averageRating: number; reviewCount: number }>();

    for (const rating of ratings) {
        ratingMap.set(rating.technicianProfileId, {
            averageRating: rating._avg.rating ?? 0,
            reviewCount: rating._count.rating
        });
    }

    // Add the rating to each service's technician details.
    const servicesWithRatings = services.map(service => {
        const technicianRating = ratingMap.get(service.technicianProfileId);

        return {
            ...service,
            technicianProfile: {
                ...service.technicianProfile,
                averageRating: technicianRating?.averageRating ?? 0,
                reviewCount: technicianRating?.reviewCount ?? 0
            }
        };
    });

     // If requested, keep only technicians meeting the minimum rating.
    const minRating = filters.minRating;

    if (minRating !== undefined) {
        return servicesWithRatings.filter(
            service => service.technicianProfile.averageRating >= minRating
        );
    }

    return servicesWithRatings;
}

export const serviceService = {
    createServiceIntoDB,
    getAllServicesFromDB
}