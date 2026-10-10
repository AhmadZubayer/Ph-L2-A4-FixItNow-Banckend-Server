import { prisma } from "../../lib/prisma";
import { IUpdateTechnicianProfile } from "./technician.interface";
import { ActiveStatus } from "../../../generated/prisma/enums";
import httpStatus from "http-status";
import { AppError } from "../../utils/appError";

const updateTechnicianProfileIntoDB = async (userId: string, payload: IUpdateTechnicianProfile) => {
    const profile = await prisma.technicianProfile.upsert({
        where: {
            userId
        },
        update: payload,
        create: {
            ...payload,
            userId
        }
    });

    return profile;
}

const getTechnicianByIdFromDB = async (id: string) => {
    const technician = await prisma.technicianProfile.findFirst({
        where: {
            id,
            user: {
                activeStatus: ActiveStatus.ACTIVE
            }
        },
        select: {
            id: true,
            bio: true,
            skills: true,
            experienceYears: true,
            location: true,
            profilePhoto: true,
            user: {
                select: {
                    id: true,
                    name: true
                }
            },
            services: {
                where: {
                    isActive: true,
                    category: {
                        isActive: true
                    }
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    price: true,
                    durationMinutes: true,
                    category: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            },
            reviews: {
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                    customer: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc"
                }
            }
        }
    });

    if (!technician) {
        throw new AppError(httpStatus.NOT_FOUND, "Technician not found");
    }

    const reviewCount = technician.reviews.length;
    const averageRating = reviewCount > 0
        ? technician.reviews.reduce((total, review) => total + review.rating, 0) / reviewCount
        : 0;

    return {
        ...technician,
        averageRating,
        reviewCount
    };
}

const getAllTechniciansFromDB = async () => {
    const technicians = await prisma.technicianProfile.findMany({
        where: {
            user: {
                activeStatus: ActiveStatus.ACTIVE
            }
        },
        select: {
            id: true,
            bio: true,
            skills: true,
            experienceYears: true,
            location: true,
            profilePhoto: true,
            user: {
                select: {
                    id: true,
                    name: true
                }
            },
            services: {
                where: {
                    isActive: true,
                    category: {
                        isActive: true
                    }
                },
                select: {
                    id: true,
                    title: true,
                    price: true,
                    category: {
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

    return technicians;
}

export const technicianService = {
    updateTechnicianProfileIntoDB,
    getAllTechniciansFromDB,
    getTechnicianByIdFromDB
}