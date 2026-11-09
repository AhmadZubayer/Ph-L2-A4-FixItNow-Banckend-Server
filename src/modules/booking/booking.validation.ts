import { z } from "zod";

const availabilitySlotId = z.uuid("A valid availability slot ID is required");
const serviceId = z.uuid("A valid service ID is required").transform(id => id.toLowerCase());
const createBookingSchema = z.union([
    z.strictObject({
        serviceIds: z.array(serviceId).min(1).max(50)
            .refine(ids => new Set(ids).size === ids.length, "Select each service only once"),
        availabilitySlotId
    }),
    z.strictObject({ serviceId, availabilitySlotId })
        .transform(({ serviceId, availabilitySlotId }) => ({ serviceIds: [serviceId], availabilitySlotId }))
]);

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
