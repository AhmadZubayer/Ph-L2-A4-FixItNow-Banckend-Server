import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/appError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { serviceService } from "./service.service";
import { IServiceFilters } from "./service.interface";

const createService = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Please log in to access this resource");
    }

    const payload = req.body;

    const service = await serviceService.createServiceIntoDB(req.user.id, payload);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Service created successfully",
        data: service
    });
});

const getAllServices = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const filters = res.locals.validatedQuery as IServiceFilters;

    const services = await serviceService.getAllServicesFromDB(filters);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Services retrieved successfully",
        data: services
    });
});

export const serviceController = {
    createService,
    getAllServices
}