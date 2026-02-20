require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB, disconnectDB, pool } = require("./utils/dbConnection");
const { swaggerUi, swaggerSpec } = require("./swagger/swagger.config");
const body_parser = require("body-parser");
const helmet = require("helmet");
const path = require("path");
const { authLimiter, apiLimiter } = require("./middlewares/rateLimiter");

const app = express();
const port = process.env.PORT || 7860;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));
app.use(
  helmet({
    contentSecurityPolicy: false, 
  })
);


app.use(
  cors({
    origin: ["http://localhost:3000", "https://van-pooling-front.vercel.app"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// routes
app.get("/swagger.json", (req, res) => res.json(swaggerSpec));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authLimiter, require("./routes/auth/authRoute"));
app.use("/api/users", apiLimiter, require("./routes/users/userRoutes"));
app.use("/api/parents", apiLimiter, require("./routes/parents/parentRoute"));
app.use(
  "/api/payments",
  apiLimiter,
  require("./routes/payments/paymentRoutes")
);
app.use(
  "/api/bookings",
  apiLimiter,
  require("./routes/bookings/bookingRoutes")
);
app.use("/api/vans", apiLimiter, require("./routes/vans/vanRoutes"));
app.use("/api/guards", apiLimiter, require("./routes/guards/guardRoutes"));
app.use("/api/drivers", apiLimiter, require("./routes/drivers/driverRoutes"));
app.use("/api/admin", apiLimiter, require("./routes/admin/adminRoutes"));
app.use("/api/schools", apiLimiter, require("./routes/schools/schoolRoutes"));

app.get("/", (req, res) => {
  res.send("Welcome to the FYP Backend API");
});

//middlewares for error handling
app.use(require("./middlewares/errorsHandling").routeNotFoundMiddleware);
app.use(require("./middlewares/errorsHandling").errorMiddleware);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await disconnectDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down server...");
  await disconnectDB();
  process.exit(0);
});

startServer();
module.exports = app;
