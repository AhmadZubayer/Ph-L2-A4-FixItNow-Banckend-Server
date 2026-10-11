import httpStatus from "http-status";
import { ActiveStatus, BookingStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";
import { ICreateBooking } from "./booking.interface";

// createBookingIntoDB
// getMyBookingsFromDB
// getBookingByIdFromDB
// getTechnicianBookingsFromDB
// updateBookingStatusIntoDB
// cancelBookingIntoDB


// Customer and selected service/slot 
// → check that booking is allowed 
// → claim the slot 
// → create a REQUESTED booking.
const createBookingIntoDB = async (customerId: string, payload: ICreateBooking) => {
    const activeBookingStatuses = [
        BookingStatus.REQUESTED,
        BookingStatus.ACCEPTED,
        BookingStatus.PAID,
        BookingStatus.IN_PROGRESS
    ];

    const now = new Date();

    return prisma.$transaction(async transaction => {
        // Find an active service offered by an active technician.
        const service = await transaction.service.findFirst({
            where: {
                id: payload.serviceId,
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
            select: {
                id: true,
                price: true,
                durationMinutes: true,
                technicianProfileId: true
            }
        });

        if (!service) {
            throw new AppError(httpStatus.NOT_FOUND, "Service not found");
        }

        // The slot must belong to this service's technician and be in the future.
        const slot = await transaction.availabilitySlot.findFirst({
            where: {
                id: payload.availabilitySlotId,
                technicianProfileId: service.technicianProfileId,
                isActive: true,
                startAt: {
                    gt: now
                }
            },
            select: {
                id: true,
                startAt: true,
                endAt: true
            }
        });

        if (!slot) {
            throw new AppError(httpStatus.CONFLICT, "This slot is not available");
        }

        const slotLengthMinutes = (slot.endAt.getTime() - slot.startAt.getTime()) / 60000;

        if (slotLengthMinutes < service.durationMinutes) {
            throw new AppError(httpStatus.BAD_REQUEST, "This slot is too short for the service");
        }

        // Claim the slot only if it is still free.
        const claimedSlot = await transaction.availabilitySlot.updateMany({
            where: {
                id: slot.id,
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
            data: {
                isActive: false
            }
        });

        if (claimedSlot.count === 0) {
            throw new AppError(httpStatus.CONFLICT, "This slot has already been booked");
        }

        // Copy time and price from the database, not from the customer's request.
        return transaction.booking.create({
            data: {
                customerId,
                serviceId: service.id,
                availabilitySlotId: slot.id,
                startAt: slot.startAt,
                endAt: slot.endAt,
                priceAtBooking: service.price,
                status: BookingStatus.REQUESTED
            }
        });
    });
}

const getMyBookingsFromDB = async (customerId: string) => {
    return prisma.booking.findMany({
        where: {
            customerId
        },
        select: {
            id: true,
            status: true,
            startAt: true,
            endAt: true,
            priceAtBooking: true,
            availabilitySlotId: true,
            createdAt: true,
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
}

const getBookingByIdFromDB = async (id: string, customerId: string) => {
    const booking = await prisma.booking.findFirst({
        where: {
            id,
            customerId
        },
        select: {
            id: true,
            status: true,
            startAt: true,
            endAt: true,
            priceAtBooking: true,
            availabilitySlotId: true,
            createdAt: true,
            updatedAt: true,
            service: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    durationMinutes: true,
                    category: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    technicianProfile: {
                        select: {
                            id: true,
                            location: true,
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
        }
    });

    if (!booking) {
        throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    return booking;
}

const getTechnicianBookingsFromDB = async (technicianUserId: string) => {
    return prisma.booking.findMany({
        where: {
            service: {
                technicianProfile: {
                    userId: technicianUserId
                }
            }
        },
        select: {
            id: true,
            status: true,
            startAt: true,
            endAt: true,
            priceAtBooking: true,
            availabilitySlotId: true,
            createdAt: true,
            customer: {
                select: {
                    id: true,
                    name: true
                }
            },
            service: {
                select: {
                    id: true,
                    title: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });
}

// Technician and requested status 
// → check booking ownership and allowed status change 
// → update the booking 
// → reopen a future slot if declined.
const updateBookingStatusIntoDB = async (
    id: string,
    technicianUserId: string,
    status: BookingStatus
) => {
    return prisma.$transaction(async transaction => {
        const booking = await transaction.booking.findFirst({
            where: {
                id,
                service: {
                    technicianProfile: {
                        userId: technicianUserId
                    }
                }
            },
            select: {
                id: true,
                status: true,
                startAt: true,
                availabilitySlotId: true
            }
        });

        if (!booking) {
            throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
        }

        const isAllowed =
            (booking.status === BookingStatus.REQUESTED &&
                (status === BookingStatus.ACCEPTED || status === BookingStatus.DECLINED)) ||
            (booking.status === BookingStatus.PAID &&
                status === BookingStatus.IN_PROGRESS) ||
            (booking.status === BookingStatus.IN_PROGRESS &&
                status === BookingStatus.COMPLETED);

        if (!isAllowed) {
            throw new AppError(httpStatus.CONFLICT, "This booking status change is not allowed");
        }

        const updated = await transaction.booking.updateMany({
            where: {
                id: booking.id,
                status: booking.status
            },
            data: {
                status
            }
        });

        if (updated.count === 0) {
            throw new AppError(httpStatus.CONFLICT, "Booking status changed. Please try again");
        }

        // If a future request is declined, offer its slot again.
        if (status === BookingStatus.DECLINED && booking.startAt > new Date()) {
            await transaction.availabilitySlot.updateMany({
                where: {
                    id: booking.availabilitySlotId,
                    bookings: {
                        none: {
                            status: {
                                in: [
                                    BookingStatus.REQUESTED,
                                    BookingStatus.ACCEPTED,
                                    BookingStatus.PAID,
                                    BookingStatus.IN_PROGRESS
                                ]
                            }
                        }
                    }
                },
                data: {
                    isActive: true
                }
            });
        }

        return transaction.booking.findUniqueOrThrow({
            where: {
                id: booking.id
            }
        });
    });
}

// Customer and booking ID 
// → check ownership and that the booking is REQUESTED or ACCEPTED 
// → mark it CANCELLED 
// → reopen its future slot.
const cancelBookingIntoDB = async (id: string, customerId: string) => {
    return prisma.$transaction(async transaction => {
        const booking = await transaction.booking.findFirst({
            where: {
                id,
                customerId
            },
            select: {
                id: true,
                status: true,
                startAt: true,
                availabilitySlotId: true
            }
        });

        if (!booking) {
            throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
        }

        if (
            booking.status !== BookingStatus.REQUESTED &&
            booking.status !== BookingStatus.ACCEPTED
        ) {
            throw new AppError(httpStatus.CONFLICT, "This booking cannot be cancelled");
        }

        const updated = await transaction.booking.updateMany({
            where: {
                id: booking.id,
                status: booking.status
            },
            data: {
                status: BookingStatus.CANCELLED
            }
        });

        if (updated.count === 0) {
            throw new AppError(httpStatus.CONFLICT, "Booking status changed. Please try again");
        }

        // Offer the slot again if its start time is still in the future.
        if (booking.startAt > new Date()) {
            await transaction.availabilitySlot.updateMany({
                where: {
                    id: booking.availabilitySlotId,
                    bookings: {
                        none: {
                            status: {
                                in: [
                                    BookingStatus.REQUESTED,
                                    BookingStatus.ACCEPTED,
                                    BookingStatus.PAID,
                                    BookingStatus.IN_PROGRESS
                                ]
                            }
                        }
                    }
                },
                data: {
                    isActive: true
                }
            });
        }

        return transaction.booking.findUniqueOrThrow({
            where: {
                id: booking.id
            }
        });
    });
}

export const bookingService = {
    createBookingIntoDB,
    getMyBookingsFromDB,
    getBookingByIdFromDB,
    getTechnicianBookingsFromDB,
    updateBookingStatusIntoDB,
    cancelBookingIntoDB
}