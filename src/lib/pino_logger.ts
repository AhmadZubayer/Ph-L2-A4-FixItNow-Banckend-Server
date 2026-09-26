import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: "info",
  redact: ["req.headers.authorization", "req.headers.cookie"],
  transport: {
    targets: [
      {
        target: isProduction ? "pino/file" : "pino-pretty",
        options: isProduction
          ? { destination: 1 } // terminal
          : { colorize: true },
      },
      {
        target: "pino/file",
        options: { destination: "./logs/app.log", mkdir: true },
      },
    ],
  },
});