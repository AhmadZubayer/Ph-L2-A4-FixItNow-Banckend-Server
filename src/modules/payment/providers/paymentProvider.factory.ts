import httpStatus from "http-status";
import { PaymentProvider } from "../../../../generated/prisma/enums";
import { AppError } from "../../../utils/appError";
import { IPaymentProvider } from "../payment.interface";
import { stripePaymentProvider } from "./stripe/stripe.provider";

export const getPaymentProvider = (provider: PaymentProvider): IPaymentProvider => {
    switch (provider) {
        case PaymentProvider.STRIPE:
            return stripePaymentProvider;

        default:
            throw new AppError(httpStatus.NOT_IMPLEMENTED, "Payment provider is not supported");
    }
}