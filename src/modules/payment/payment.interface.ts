import { PaymentProvider, PaymentStatus } from "../../../generated/prisma/enums";

export interface ICreatePayment {
    bookingId: string;
    provider?: PaymentProvider;
}

// Strategy pattern
export interface ICreateCheckoutPayload {
    bookingId: string;
    paymentId: string;
    amount: string;
    currency: string;
    serviceTitle: string;
    customerEmail: string;
}

export interface ICheckoutResult {
    providerTransactionId: string;
    checkoutUrl: string;
}

export interface ICompletePayment {
    paymentId: string;
    bookingId: string;
    provider: PaymentProvider;
    providerTransactionId: string;
    amount: string;
    currency: string;
}

export interface IClosePayment {
    paymentId: string;
    bookingId: string;
    provider: PaymentProvider;
    providerTransactionId: string;
    status: PaymentStatus;
}

export interface IRefundPayment {
    paymentId: string;
    providerTransactionId: string;
}

export interface IRefundResult {
    providerRefundId: string;
    status: string | null;
}

export interface IPaymentProvider {
    createCheckoutSession(payload: ICreateCheckoutPayload): Promise<ICheckoutResult>;
    refundPayment(payload: IRefundPayment): Promise<IRefundResult>;
}