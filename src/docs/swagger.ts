import { readFileSync } from "node:fs";

export const swaggerDocument = JSON.parse(
  readFileSync("./swagger-output.json", "utf8"),
);