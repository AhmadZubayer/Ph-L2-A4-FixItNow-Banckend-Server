import "dotenv/config";
import bcrypt from "bcrypt";
import { z } from "zod";
import { UserRole } from "../generated/prisma/enums";
import { prisma } from "../src/lib/prisma";

const adminEnvSchema = z.object({
    ADMIN_EMAIL: z.email(),
    ADMIN_PASSWORD: z.string().min(8),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10)
});

const seedAdmin = async () => {
    const env = adminEnvSchema.parse(process.env);
    const email = env.ADMIN_EMAIL.toLowerCase();

    const existingUser = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if (existingUser) {
        if (existingUser.role !== UserRole.ADMIN) {
            throw new Error("Admin email already belongs to a non-admin user");
        }

        console.log("Admin user already exists");
        return;
    }

    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, env.BCRYPT_SALT_ROUNDS);

    await prisma.user.create({
        data: {
            name: "FixItNow Admin",
            email,
            passwordHash,
            role: UserRole.ADMIN
        }
    });

    console.log("Admin user created successfully");
}

seedAdmin()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });