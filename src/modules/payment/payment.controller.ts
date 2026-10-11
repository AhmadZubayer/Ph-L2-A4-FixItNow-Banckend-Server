import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/appError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";
import { stripeWebhook } from "./providers/stripe/stripe.webhook";

const createPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Please log in to access this resource");
    }

    const result = await paymentService.createPaymentIntoDB(
        req.user.id,
        req.body
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Payment checkout session created successfully",
        data: result
    });
});


export const paymentController = {
    createPayment
}