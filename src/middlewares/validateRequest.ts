import { RequestHandler } from "express";
import httpStatus from "http-status";
import { z } from "zod";
import { AppError } from "../utils/appError";

export const validateRequest = (schema: z.ZodType): RequestHandler => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return next(new AppError(
                httpStatus.BAD_REQUEST,
                "Validation failed",
                result.error.issues.map(issue => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            ));
        }

        req.body = result.data;
        next();
    }
}