import httpStatus from "http-status";
import { ActiveStatus, BookingStatus, PaymentStatus } from "../../../generated/prisma/enums";
import { paymentService } from "../payment/payment.service";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";
import { ICreateBooking } from "./booking.interface";
import { Prisma } from "../../../generated/prisma/client";
import { bookingItems } from "./booking-items";

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
        const services = await transaction.service.findMany({
            where: {
                id: { in: payload.serviceIds },
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
                title: true,
                price: true,
                durationMinutes: true,
                technicianProfileId: true
            }
        });

        if (services.length !== payload.serviceIds.length) {
            throw new AppError(httpStatus.NOT_FOUND, "One or more selected services are unavailable");
        }

        const servicesById = new Map(services.map(service => [service.id, service]));
        const selected = payload.serviceIds.map(id => servicesById.get(id)!);
        const primary = selected[0];
        if (!primary || selected.some(service => service.technicianProfileId !== primary.technicianProfileId)) {
            throw new AppError(httpStatus.BAD_REQUEST, "Select services from one technician");
        }
        const duration = selected.reduce((total, service) => total + service.durationMinutes, 0);
        const price = selected.reduce((total, service) => total.plus(service.price), new Prisma.Decimal(0));
        if (price.gt("99999999.99")) {
            throw new AppError(httpStatus.BAD_REQUEST, "The combined price exceeds the booking limit");
        }

        const slot = await transaction.availabilitySlot.findFirst({
            where: {
                id: payload.availabilitySlotId,
                technicianProfileId: primary.technicianProfileId,
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

        if (slotLengthMinutes < duration) {
            throw new AppError(httpStatus.BAD_REQUEST, "This slot is too short for the selected services");
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
                serviceId: primary.id,
                availabilitySlotId: slot.id,
                startAt: slot.startAt,
                endAt: slot.endAt,
                priceAtBooking: price,
                status: BookingStatus.REQUESTED,
                items: {
                    create: selected.map(({ id, title, price, durationMinutes }, position) => ({
                        serviceId: id, title, price, durationMinutes, position
                    }))
                }
            },
            include: { items: bookingItems }
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
            items: bookingItems,
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
            items: bookingItems,
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
            items: bookingItems,
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

// Check the customer's booking and cancel it in a transaction.
// If it was paid, request the refund after the transaction finishes.
const cancelBookingIntoDB = async (id: string, customerId: string) => {
    const result = await prisma.$transaction(async transaction => {
        const booking = await transaction.booking.findFirst({
            where: {
                id,
                customerId
            },
            select: {
                id: true,
                status: true,
                startAt: true,
                availabilitySlotId: true,
                payments: {
                    where: {
                        status: PaymentStatus.COMPLETED
                    },
                    select: {
                        id: true
                    },
                    take: 1
                }
            }
        });

        if (!booking) {
            throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
        }

        if (booking.status === BookingStatus.CANCELLED) {
            return {
                cancelledBooking: await transaction.booking.findUniqueOrThrow({
                    where: {
                        id: booking.id
                    }
                }),
                shouldRefund: booking.payments.length > 0
            };
        }

        if (
            booking.status !== BookingStatus.REQUESTED &&
            booking.status !== BookingStatus.ACCEPTED &&
            booking.status !== BookingStatus.PAID
        ) {
            throw new AppError(httpStatus.CONFLICT, "This booking cannot be cancelled");
        }

        if (booking.status === BookingStatus.PAID && booking.payments.length === 0) {
            throw new AppError(httpStatus.CONFLICT, "Paid booking payment was not found");
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

        return {
            cancelledBooking: await transaction.booking.findUniqueOrThrow({
                where: {
                    id: booking.id
                }
            }),
            shouldRefund: booking.status === BookingStatus.PAID
        };
    });

    if (result.shouldRefund) {
        await paymentService.refundCancelledPaidBookingIntoDB(id);
    }

    return result.cancelledBooking;
}

export const bookingService = {
    createBookingIntoDB,
    getMyBookingsFromDB,
    getBookingByIdFromDB,
    getTechnicianBookingsFromDB,
    updateBookingStatusIntoDB,
    cancelBookingIntoDB
}
