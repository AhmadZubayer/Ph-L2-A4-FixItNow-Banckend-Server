import express, { Application, Request, Response } from "express";
import config from "./config";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./docs/swagger";
import pinoHttp from "pino-http";
import { logger } from "./lib/pino_logger";

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

export default app;