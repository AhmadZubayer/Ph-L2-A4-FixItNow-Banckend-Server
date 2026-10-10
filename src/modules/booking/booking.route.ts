import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { bookingController } from "./booking.controller";
import { bookingValidation } from "./booking.validation";
import { validateParams } from "../../middlewares/validateParams";

export const bookingRoutes = Router();
export const technicianBookingRoutes = Router();

bookingRoutes.post(
    "/",
    auth(UserRole.CUSTOMER),
    validateRequest(bookingValidation.createBookingSchema),
    bookingController.createBooking
);

bookingRoutes.get(
    "/",
    auth(UserRole.CUSTOMER),
    bookingController.getMyBookings
);

bookingRoutes.get(
    "/:id",
    auth(UserRole.CUSTOMER),
    validateParams(bookingValidation.getBookingParamsSchema),
    bookingController.getBookingById
);

technicianBookingRoutes.get(
    "/",
    auth(UserRole.TECHNICIAN),
    bookingController.getTechnicianBookings
);

technicianBookingRoutes.patch(
    "/:id",
    auth(UserRole.TECHNICIAN),
    validateParams(bookingValidation.getBookingParamsSchema),
    validateRequest(bookingValidation.updateBookingStatusSchema),
    bookingController.updateBookingStatus
);

bookingRoutes.patch(
    "/:id/cancel",
    auth(UserRole.CUSTOMER),
    validateParams(bookingValidation.getBookingParamsSchema),
    bookingController.cancelBooking
);