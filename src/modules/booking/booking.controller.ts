import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/appError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { bookingService } from "./booking.service";

const createBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Please log in to access this resource");
    }

    const booking = await bookingService.createBookingIntoDB(
        req.user.id,
        req.body
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Booking created successfully",
        data: booking
    });
});

const getMyBookings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Please log in to access this resource");
    }

    const bookings = await bookingService.getMyBookingsFromDB(req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Bookings retrieved successfully",
        data: bookings
    });
});

const getBookingById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Please log in to access this resource");
    }

    const { id } = res.locals.validatedParams as { id: string };

    const booking = await bookingService.getBookingByIdFromDB(
        id,
        req.user.id
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Booking retrieved successfully",
        data: booking
    });
});

const getTechnicianBookings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Please log in to access this resource");
    }

    const bookings = await bookingService.getTechnicianBookingsFromDB(req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Technician bookings retrieved successfully",
        data: bookings
    });
});

const updateBookingStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Please log in to access this resource");
    }

    const { id } = res.locals.validatedParams as { id: string };
    const { status } = req.body;

    const booking = await bookingService.updateBookingStatusIntoDB(
        id,
        req.user.id,
        status
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Booking status updated successfully",
        data: booking
    });
});

const cancelBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Please log in to access this resource");
    }

    const { id } = res.locals.validatedParams as { id: string };

    const booking = await bookingService.cancelBookingIntoDB(
        id,
        req.user.id
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Booking cancelled successfully",
        data: booking
    });
});

export const bookingController = {
    createBooking,
    getMyBookings,
    getBookingById,
    getTechnicianBookings,
    updateBookingStatus,
    cancelBooking
}