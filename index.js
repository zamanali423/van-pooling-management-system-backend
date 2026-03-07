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

const allowedOrigins = [
  "*",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://van-pooling-front.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use("/uploads", (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, filePath, stat) => {
      const origin = res.req && res.req.headers && res.req.headers.origin;
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Vary", "Origin");
      }
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);
app.use(
  "/uploads",
  express.static(path.resolve("uploads"))
);

console.log("Serving uploads from:", path.join(__dirname, "uploads"));

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// routes
app.get("/swagger.json", (req, res) => res.json(swaggerSpec));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", require("./routes/auth/authRoute"));
app.use("/api/users", require("./routes/users/userRoutes"));
app.use("/api/parents", require("./routes/parents/parentRoute"));
app.use("/api/payments", require("./routes/payments/paymentRoutes"));
app.use("/api/bookings", require("./routes/bookings/bookingRoutes"));
app.use("/api/vans", require("./routes/vans/vanRoutes"));
app.use("/api/guards", require("./routes/guards/guardRoutes"));
app.use("/api/drivers", require("./routes/drivers/driverRoutes"));
app.use("/api/admin", require("./routes/admin/adminRoutes"));
app.use("/api/schools", require("./routes/schools/schoolRoutes"));
app.use("/api/police", require("./routes/police/policeRoutes"));

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
    // if(!process.env.VERCEL){
    //   await app.listen(port);
    //   console.log(`Server is running on port ${port} vercel`);
    // }else{
    //   await app.init();
    //   console.log(`Server is running on port ${port} init`);
    // }
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
