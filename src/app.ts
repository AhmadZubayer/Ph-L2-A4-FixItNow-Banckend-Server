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
import { technicianRoutes } from "./modules/technician/technician.route";
import { technicianServiceRoutes } from "./modules/service/service.route";

const app : Application = express();

app.use(cors({
    origin : config.app_url,
    credentials : true,
}))

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

app.use(notFound);
app.use(globalErrorHandler);

export default app;