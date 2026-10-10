import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ActiveStatus, UserRole } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/appError";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                name: string;
                email: string;
                role: UserRole;
            }
        }
    }
}

export const auth = (...requiredRoles: UserRole[]) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const authorization = req.headers.authorization;
        const token = req.cookies?.accessToken || (
            authorization?.startsWith("Bearer ")
                ? authorization.split(" ")[1]
                : authorization
        );

        if (typeof token !== "string" || !token) {
            throw new AppError(httpStatus.UNAUTHORIZED, "Please log in to access this resource");
        }

        const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret);
        const decoded = verifiedToken.data;

        if (!verifiedToken.success || typeof decoded !== "object" || decoded === null || typeof decoded.id !== "string") {
            throw new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired access token");
        }

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id
            }
        });

        if (!user) {
            throw new AppError(httpStatus.UNAUTHORIZED, "User not found. Please log in again");
        }

        if (user.activeStatus === ActiveStatus.BLOCKED) {
            throw new AppError(httpStatus.FORBIDDEN, "Your account has been blocked");
        }

        if (requiredRoles.length && !requiredRoles.includes(user.role)) {
            throw new AppError(httpStatus.FORBIDDEN, "You do not have permission to access this resource");
        }

        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        next();
    })
}