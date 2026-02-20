const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Van Pooling Management System API",
      version: "1.0.0",
      description: "API documentation for my van pooling management system",
    },
    servers: [
      {
        url: "http://localhost:1627",
        description: "Local development server",
      },
      {
        url: "https://zamanali423-van-pooling-management-system.hf.space",
        description: "Production Server",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./swagger/*.swagger.js"],
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
