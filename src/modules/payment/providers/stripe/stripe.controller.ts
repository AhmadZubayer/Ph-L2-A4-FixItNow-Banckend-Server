import { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../../../utils/appError";
import { catchAsync } from "../../../../utils/catchAsync";
import { stripeWebhook } from "./stripe.webhook";

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];

    if (typeof signature !== "string" || !Buffer.isBuffer(req.body)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid Stripe webhook request");
    }

    await stripeWebhook.handleWebhook(req.body, signature);

    res.status(httpStatus.OK).json({
        received: true
    });
});

export const stripeController = {
    handleStripeWebhook
}