CREATE TABLE "booking_items" (
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("bookingId", "serviceId")
);

CREATE UNIQUE INDEX "booking_items_bookingId_position_key" ON "booking_items"("bookingId", "position");
CREATE INDEX "booking_items_serviceId_idx" ON "booking_items"("serviceId");

ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
