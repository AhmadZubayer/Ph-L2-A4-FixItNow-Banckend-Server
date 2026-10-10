import { prisma } from "../../lib/prisma";
import { IUpdateTechnicianProfile } from "./technician.interface";
import { ActiveStatus } from "../../../generated/prisma/enums";

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
    getAllTechniciansFromDB
}