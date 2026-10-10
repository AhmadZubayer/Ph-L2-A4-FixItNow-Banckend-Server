import { z } from "zod";

const createBookingSchema = z.object({
    serviceId: z.uuid("A valid service ID is required"),
    availabilitySlotId: z.uuid("A valid availability slot ID is required")
});

const getBookingParamsSchema = z.object({
    id: z.uuid("A valid booking ID is required")
});

const updateBookingStatusSchema = z.object({
    status: z.enum(["ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED"])
});

export const bookingValidation = {
    createBookingSchema,
    getBookingParamsSchema,
    updateBookingStatusSchema
}