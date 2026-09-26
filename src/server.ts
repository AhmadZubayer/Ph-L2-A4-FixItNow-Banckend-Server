import "dotenv/config";
import config from "./config";
import { prisma } from "./lib/prisma";
import { logger } from "./lib/pino_logger";

const PORT = config.port;

async function main() {
    try {
        if (process.env.NODE_ENV !== "production") {
            await import(new URL("../swagger.mjs", import.meta.url).href);
        }

        const { default: app } = await import("./app");
        await prisma.$connect();
        logger.info("Connected to the Prisma database successfully.");
       app.listen(PORT, () => {
        logger.info({ port: PORT }, "Server is running");
       }) 
    } catch (error) {
        logger.error({ err: error }, "Error starting the server");
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();
