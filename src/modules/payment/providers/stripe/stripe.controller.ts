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

const showSuccessReturn = (_req: Request, res: Response) => {
    res.status(httpStatus.OK).send(
        "Payment submitted. We are confirming it with Stripe. Check your booking status shortly."
    );
};

const showCancelReturn = (_req: Request, res: Response) => {
    res.status(httpStatus.OK).send(
        "You left Stripe Checkout. No payment was confirmed on this page."
    );
};

export const stripeController = {
    handleStripeWebhook,
    showSuccessReturn,
    showCancelReturn
}