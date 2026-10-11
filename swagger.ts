import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.OAS3Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "FixItNow API",
            version: "1.0.0"
        },
        servers: [{ url: "/" }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },
    apis: ["./src/modules/**/*.docs.ts"]
};

export const swaggerDocument = swaggerJsdoc(options);