import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { adminService } from "./admin.service";
import { AppError } from "../../utils/appError";

const getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const users = await adminService.getAllUsersFromDB();

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Users retrieved successfully",
        data: users
    });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Please log in to access this resource");
    }

    const { id } = res.locals.validatedParams as { id: string };

    const user = await adminService.updateUserStatusIntoDB(
        req.user.id,
        id,
        req.body
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User status updated successfully",
        data: user
    });
});

const getAllBookings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const bookings = await adminService.getAllBookingsFromDB();

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Bookings retrieved successfully",
        data: bookings
    });
});

export const adminController = {
    getAllUsers,
    updateUserStatus,
    getAllBookings
}