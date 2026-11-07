import httpStatus from "http-status";
import { BookingStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";
import { ISetAvailability } from "./availability.interface";

const setAvailabilityIntoDB = async (userId: string, payload: ISetAvailability) => {
    
    // flow:
    // userId finds the technician profile 
    // → the transaction reads existing times 
    // → isAvailable checks for overlaps 
    // → createMany adds the new times 
    // → findMany returns all free future times.
    
    const technicianProfile = await prisma.technicianProfile.findUnique({
        where: {
            userId
        }
    });

    if (!technicianProfile) {
        throw new AppError(httpStatus.BAD_REQUEST, "Create your technician profile first");
    }

    const activeBookingStatuses = [
        BookingStatus.REQUESTED,
        BookingStatus.ACCEPTED,
        BookingStatus.PAID,
        BookingStatus.IN_PROGRESS
    ];

    const now = new Date();

    return prisma.$transaction(async transaction => {
        // Find future slots that are active or have an active booking.
        const existingSlots = await transaction.availabilitySlot.findMany({
            where: {
                technicianProfileId: technicianProfile.id,
                endAt: {
                    gt: now
                },
                OR: [
                    {
                        isActive: true
                    },
                    {
                        bookings: {
                            some: {
                                status: {
                                    in: activeBookingStatuses
                                }
                            }
                        }
                    }
                ]
            },
            select: {
                startAt: true,
                endAt: true
            }
        });

        // Every new slot must be separate from every existing slot.
        const isAvailable = payload.slots.every(slot =>
            existingSlots.every(existing =>
                Date.parse(slot.endAt) <= existing.startAt.getTime() ||
                Date.parse(slot.startAt) >= existing.endAt.getTime()
            )
        );

        if (!isAvailable) {
            throw new AppError(httpStatus.CONFLICT, "A slot overlaps existing availability");
        }

        // Add new slots without changing existing free slots.
        if (payload.slots.length > 0) {
            await transaction.availabilitySlot.createMany({
                data: payload.slots.map(slot => ({
                    startAt: new Date(slot.startAt),
                    endAt: new Date(slot.endAt),
                    technicianProfileId: technicianProfile.id
                }))
            });
        }

        // Return active future slots that have no active booking.
        return transaction.availabilitySlot.findMany({
            where: {
                technicianProfileId: technicianProfile.id,
                isActive: true,
                startAt: {
                    gt: now
                },
                bookings: {
                    none: {
                        status: {
                            in: activeBookingStatuses
                        }
                    }
                }
            },
            orderBy: {
                startAt: "asc"
            }
        });
    });
}

const blockAvailabilityIntoDB = async (userId: string, id: string) => {
    const updated = await prisma.availabilitySlot.updateMany({
        where: {
            id,
            isActive: true,
            startAt: { gt: new Date() },
            technicianProfile: { userId },
            bookings: {
                none: {
                    status: { in: [BookingStatus.REQUESTED, BookingStatus.ACCEPTED, BookingStatus.PAID, BookingStatus.IN_PROGRESS] }
                }
            }
        },
        data: { isActive: false }
    });

    if (updated.count === 0) throw new AppError(httpStatus.CONFLICT, "This slot cannot be blocked");
    return prisma.availabilitySlot.findUniqueOrThrow({ where: { id } });
}

export const availabilityService = {
    setAvailabilityIntoDB,
    blockAvailabilityIntoDB
}
