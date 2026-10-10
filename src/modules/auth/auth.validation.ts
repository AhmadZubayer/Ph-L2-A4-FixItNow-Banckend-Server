import { z } from "zod";

const registerUserSchema = z.object({
    name: z.string().trim().min(2, "Name must contain at least 2 characters"),
    email: z.email("A valid email is required"),
    password: z.string().min(8, "Password must contain at least 8 characters"),
    role: z.enum(["CUSTOMER", "TECHNICIAN"])
});

const loginUserSchema = z.object({
    email: z.email("A valid email is required"),
    password: z.string().min(1, "Password is required")
});

const refreshTokenSchema = z.object({
    refreshToken: z.string().trim().min(1, "Refresh token is required")
});

export const authValidation = {
    registerUserSchema,
    loginUserSchema,
    refreshTokenSchema
}