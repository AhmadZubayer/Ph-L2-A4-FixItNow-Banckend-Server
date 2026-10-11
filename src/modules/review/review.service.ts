import httpStatus from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import { BookingStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";
import { ICreateReview } from "./review.interface";

const createReviewIntoDB = async (customerId: string, payload: ICreateReview) => {
    const booking = await prisma.booking.findFirst({
        where: {
            id: payload.bookingId,
            customerId
        },
        select: {
            status: true,
            service: {
                select: {
                    technicianProfileId: true
                }
            }
        }
    });

    if (!booking) {
        throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    if (booking.status !== BookingStatus.COMPLETED) {
        throw new AppError(httpStatus.CONFLICT, "Only completed bookings can be reviewed");
    }

    try {
        return await prisma.review.create({
            data: {
                bookingId: payload.bookingId,
                customerId,
                technicianProfileId: booking.service.technicianProfileId,
                rating: payload.rating,
                comment: payload.comment
            }
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new AppError(httpStatus.CONFLICT, "This booking already has a review");
        }

        throw error;
    }
}

export const reviewService = {
    createReviewIntoDB
}