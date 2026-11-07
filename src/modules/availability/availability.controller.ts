import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/appError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { availabilityService } from "./availability.service";

const setAvailability = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Please log in to access this resource");
    }

    const slots = await availabilityService.setAvailabilityIntoDB(
        req.user.id,
        req.body
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Availability saved successfully",
        data: slots
    });
});

const blockAvailability = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError(httpStatus.UNAUTHORIZED, "Please log in to access this resource");
    const { id } = res.locals.validatedParams as { id: string };
    const slot = await availabilityService.blockAvailabilityIntoDB(req.user.id, id);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Availability blocked successfully",
        data: slot
    });
});

export const availabilityController = {
    setAvailability,
    blockAvailability
}
