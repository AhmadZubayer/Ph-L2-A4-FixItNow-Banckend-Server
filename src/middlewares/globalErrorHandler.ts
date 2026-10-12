import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        message,
        errorDetails: err.errorDetails || (
            process.env.APP_ENV === "production" ? null : err.stack
        )
    })
}