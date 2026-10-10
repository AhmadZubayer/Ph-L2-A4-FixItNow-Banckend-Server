import bcrypt from "bcrypt";
import httpStatus from "http-status";
import { SignOptions } from "jsonwebtoken";
import { ActiveStatus } from "../../../generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";
import { jwtUtils } from "../../utils/jwt";
import { ILoginUser, IRegisterUser } from "./auth.interface";

const registerUserIntoDB = async (payload: IRegisterUser) => {
    const { name, email, password, role } = payload;
    const normalizedEmail = email.toLowerCase();

    const isUserExist = await prisma.user.findUnique({
        where: {
            email: normalizedEmail
        }
    });

    if (isUserExist) {
        throw new AppError(httpStatus.CONFLICT, "A user with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));

    const user = await prisma.user.create({
        data: {
            name,
            email: normalizedEmail,
            passwordHash: hashedPassword,
            role
        },
        omit: {
            passwordHash: true
        }
    });

    return user;
}

const loginUser = async (payload: ILoginUser) => {
    const { email, password } = payload;

    const user = await prisma.user.findUnique({
        where: {
            email: email.toLowerCase()
        }
    });

    if (!user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    const isPasswordMatched = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordMatched) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    if (user.activeStatus === ActiveStatus.BLOCKED) {
        throw new AppError(httpStatus.FORBIDDEN, "Your account has been blocked");
    }

    const jwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    };

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_access_secret,
        config.jwt_access_expires_in as SignOptions["expiresIn"]
    );

    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_refresh_secret,
        config.jwt_refresh_expires_in as SignOptions["expiresIn"]
    );

    return {
        accessToken,
        refreshToken
    };
}

export const authService = {
    registerUserIntoDB,
    loginUser
}