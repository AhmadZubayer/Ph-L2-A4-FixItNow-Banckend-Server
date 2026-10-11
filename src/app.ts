import express, { Application, Request, Response } from "express";
import config from "./config";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./docs/swagger";
import pinoHttp from "pino-http";
import { logger } from "./lib/pino_logger";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { notFound } from "./middlewares/notFound";
import { authRoutes } from "./modules/auth/auth.routes";
import { adminCategoryRoutes, categoryRoutes } from "./modules/category/category.route";
import { publicTechnicianRoutes, technicianRoutes } from "./modules/technician/technician.route";
import { serviceRoutes, technicianServiceRoutes } from "./modules/service/service.route";
import { availabilityRoutes } from "./modules/availability/availability.route";
import { bookingRoutes, technicianBookingRoutes } from "./modules/booking/booking.route";
import { stripeReturnRoutes, stripeWebhookRoutes } from "./modules/payment/providers/stripe/stripe.route";
import { paymentRoutes } from "./modules/payment/payment.route";
import { reviewRoutes } from "./modules/review/review.route";

const app : Application = express();

app.use(cors({
    origin : config.app_url,
    credentials : true,
}))

app.use("/api/payments/webhook", stripeWebhookRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended : true }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));

app.get("/",(req : Request, res : Response) => {
    res.send("FixItNow Backend Server. Navigate to /docs for API documentation");
});


app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/auth", authRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/technician", technicianRoutes);
app.use("/api/technician/services", technicianServiceRoutes);
app.use("/api/technicians", publicTechnicianRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/technician/availability", availabilityRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/technician/bookings", technicianBookingRoutes);
app.use("/api/payments/return", stripeReturnRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);

app.use(notFound);
app.use(globalErrorHandler);

export default app;