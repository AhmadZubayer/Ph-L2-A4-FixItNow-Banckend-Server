import { z } from "zod";
import { PaymentProvider } from "../../../generated/prisma/enums";

const createPaymentSchema = z.object({
    bookingId: z.uuid("A valid booking ID is required"),
    provider: z.enum(PaymentProvider).optional()
});

export const paymentValidation = {
    createPaymentSchema
}