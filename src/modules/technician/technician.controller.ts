import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/appError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { technicianService } from "./technician.service";

const updateTechnicianProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Please log in to access this resource");
    }

    const profile = await technicianService.updateTechnicianProfileIntoDB(
        req.user.id,
        req.body
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Technician profile saved successfully",
        data: profile
    });
});

const getAllTechnicians = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const technicians = await technicianService.getAllTechniciansFromDB();

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Technicians retrieved successfully",
        data: technicians
    });
});

export const technicianController = {
    updateTechnicianProfile,
    getAllTechnicians
}