import pino from "pino";

const isProduction = process.env.APP_ENV === "production";

export const logger = pino({
  level: "info",
  redact: ["req.headers.authorization", "req.headers.cookie"],
  transport: {
    targets: isProduction
      ? [
          {
            target: "pino/file",
            options: { destination: 1 },
          },
        ]
      : [
          {
            target: "pino-pretty",
            options: { colorize: true },
          },
          {
            target: "pino/file",
            options: { destination: "./logs/app.log", mkdir: true },
          },
        ],
  },
});