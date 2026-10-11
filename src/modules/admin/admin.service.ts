import httpStatus from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import { ActiveStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";
import { IUpdateUserStatus } from "./admin.interface";


const getAllUsersFromDB = async () => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            activeStatus: true,
            createdAt: true,
            updatedAt: true
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    return users;
}

const updateUserStatusIntoDB = async (
    adminId: string,
    userId: string,
    payload: IUpdateUserStatus
) => {
    if (adminId === userId && payload.activeStatus === ActiveStatus.BLOCKED) {
        throw new AppError(httpStatus.CONFLICT, "You cannot block your own account");
    }

    try {
        return await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                activeStatus: payload.activeStatus
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                activeStatus: true,
                updatedAt: true
            }
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            throw new AppError(httpStatus.NOT_FOUND, "User not found");
        }

        throw error;
    }
}

const getAllBookingsFromDB = async () => {
    const bookings = await prisma.booking.findMany({
        select: {
            id: true,
            status: true,
            startAt: true,
            endAt: true,
            priceAtBooking: true,
            createdAt: true,
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            service: {
                select: {
                    id: true,
                    title: true,
                    technicianProfile: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    return bookings;
}

export const adminService = {
    getAllUsersFromDB,
    updateUserStatusIntoDB,
    getAllBookingsFromDB
}