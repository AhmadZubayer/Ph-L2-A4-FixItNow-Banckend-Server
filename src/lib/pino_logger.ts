import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: "info",
  redact: ["req.headers.authorization", "req.headers.cookie"],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});