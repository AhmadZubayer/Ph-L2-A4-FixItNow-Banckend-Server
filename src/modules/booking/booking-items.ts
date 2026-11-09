import type { Prisma } from "../../../generated/prisma/client";

export const bookingItems = {
    orderBy: { position: "asc" },
    select: { serviceId: true, title: true, price: true, durationMinutes: true }
} satisfies Prisma.Booking$itemsArgs;
