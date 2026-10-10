import bcrypt from "bcrypt";
import httpStatus from "http-status";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";
import { IRegisterUser } from "./auth.interface";

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

export const authService = {
    registerUserIntoDB
}