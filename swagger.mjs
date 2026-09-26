import swaggerAutogen from "swagger-autogen";
import { fileURLToPath } from "node:url";

const doc = {
  info: { title: "FixItNow API", version: "1.0.0" },
  servers: [{ url: "/" }],
};

const outputFile = fileURLToPath(new URL("./swagger-output.json", import.meta.url));
const appFile = fileURLToPath(new URL("./src/app.ts", import.meta.url));

const result = await swaggerAutogen({ openapi: "3.0.0" })(
  outputFile,
  [appFile],
  doc,
);

if (!result || !result.success) {
  throw new Error("Could not generate Swagger documentation");
}
