import httpStatus from "http-status";
import { Prisma } from "../../../../../generated/prisma/client";
import config from "../../../../config";
import { stripe } from "../../../../lib/stripe";
import { AppError } from "../../../../utils/appError";
import { ICreateCheckoutPayload, IPaymentProvider, IRefundPayment } from "../../payment.interface";

const createCheckoutSession = async (payload: ICreateCheckoutPayload) => {
    if (!config.server_url) {
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "SERVER_URL is not configured");
    }

    if (payload.currency.toLowerCase() !== "bdt") {
        throw new AppError(httpStatus.BAD_REQUEST, "Only BDT payments are supported");
    }

    const amountInPoisha = new Prisma.Decimal(payload.amount).mul(100).toNumber();

    if (!Number.isSafeInteger(amountInPoisha) || amountInPoisha <= 0) {
        throw new AppError(httpStatus.CONFLICT, "Booking price is invalid");
    }

    const serverUrl = config.server_url.replace(/\/$/, "");

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: payload.customerEmail,
        client_reference_id: payload.bookingId,
        line_items: [
            {
                price_data: {
                    currency: "bdt",
                    product_data: {
                        name: payload.serviceTitle
                    },
                    unit_amount: amountInPoisha
                },
                quantity: 1
            }
        ],
        metadata: {
            bookingId: payload.bookingId,
            paymentId: payload.paymentId
        },
        success_url: `${serverUrl}/api/payments/return/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${serverUrl}/api/payments/return/cancel`
    });

    if (!session.url) {
        throw new AppError(httpStatus.BAD_GATEWAY, "Stripe Checkout URL was not returned");
    }

    return {
        providerTransactionId: session.id,
        checkoutUrl: session.url
    };
}

const refundPayment = async (payload: IRefundPayment) => {
    const session = await stripe.checkout.sessions.retrieve(
        payload.providerTransactionId
    );

    const paymentIntent = session.payment_intent;

    if (!paymentIntent) {
        throw new AppError(httpStatus.CONFLICT, "Stripe payment was not found");
    }

    const paymentIntentId = typeof paymentIntent === "string"
        ? paymentIntent
        : paymentIntent.id;

    const refund = await stripe.refunds.create(
        {
            payment_intent: paymentIntentId,
            reason: "requested_by_customer"
        },
        {
            idempotencyKey: `fixitnow-refund-${payload.paymentId}`
        }
    );

    return {
        providerRefundId: refund.id,
        status: refund.status
    };
}

export const stripePaymentProvider: IPaymentProvider = {
    createCheckoutSession,
    refundPayment
}