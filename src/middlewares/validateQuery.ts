import { RequestHandler } from "express";
import httpStatus from "http-status";
import { z } from "zod";
import { AppError } from "../utils/appError";

export const validateQuery = (schema: z.ZodType): RequestHandler => {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);

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

        res.locals.validatedQuery = result.data;
        next();
    }
}