import { z } from "zod";

const availabilitySlotSchema = z.object({
    startAt: z.iso.datetime({ offset: true }),
    endAt: z.iso.datetime({ offset: true })
}).refine(
    slot => Date.parse(slot.startAt) > Date.now(),
    {
        path: ["startAt"],
        message: "Start time must be in the future"
    }
).refine(
    slot => Date.parse(slot.endAt) > Date.parse(slot.startAt),
    {
        path: ["endAt"],
        message: "End time must be after start time"
    }
);

const setAvailabilitySchema = z.object({
    slots: z.array(availabilitySlotSchema)
}).refine(payload => {
    const sortedSlots = [...payload.slots].sort(
        (first, second) => Date.parse(first.startAt) - Date.parse(second.startAt)
    );

    for (let index = 1; index < sortedSlots.length; index++) {
        const previous = sortedSlots[index - 1];
        const current = sortedSlots[index];

        if (previous && current && Date.parse(previous.endAt) > Date.parse(current.startAt)) {
            return false;
        }
    }

    return true;
}, {
    path: ["slots"],
    message: "Availability slots must not overlap"
});

export const availabilityValidation = {
    setAvailabilitySchema
}