import { prisma } from "../../lib/prisma";
import { IUpdateTechnicianProfile } from "./technician.interface";

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

export const technicianService = {
    updateTechnicianProfileIntoDB
}