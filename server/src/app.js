/**
 * @file app.js
 * @description Express application setup with all security middleware,
 * route mounting, Swagger docs, and global error handler.
 */

require("dotenv").config();
require("express-async-errors");

// ─── Register All Mongoose Schemas & Models Upfront ──────────────────────────
require("./models/User");
require("./models/Student");
require("./models/Hostel");
require("./models/Block");
require("./models/Floor");
require("./models/Room");
require("./models/Application");
require("./models/Allocation");
require("./models/Complaint");
require("./models/LeaveRequest");
require("./models/Visitor");
require("./models/Payment");
require("./models/Notification");
require("./models/Chat");
require("./models/Support");
require("./models/Extra");
require("./models/CompatibilityProfile");
require("./models/CompatibilityResult");
require("./models/MessMenu");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require("path");
const logger = require("./utils/logger");

const app = express();

// ─── Trust Proxy (for Render/Railway/Vercel) ──────────────────────────────────
app.set("trust proxy", 1);

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per window
  message: { success: false, message: "Too many authentication attempts. Try again in 15 minutes." },
  skipSuccessfulRequests: true,
});

app.use("/api/", globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

// ─── Body Parsing & Compression ──────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── Data Sanitization ────────────────────────────────────────────────────────
app.use(mongoSanitize());   // Prevent NoSQL injection
app.use(xssClean());        // Sanitize XSS inputs
app.use(hpp());             // Prevent HTTP param pollution

// ─── HTTP Request Logger ──────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

// ─── Static Files (Temp uploads) ─────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ─── Swagger API Documentation ────────────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BIT Hostel Management System API",
      version: "1.0.0",
      description: "Production-ready REST API for BIT Hostel Room Allocation & Roommate Compatibility Portal",
      contact: { name: "BIT Hostel Team", email: "hostel@bit.edu.in" },
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 5000}/api`, description: "Development" },
      { url: "https://bit-hostel-api.onrender.com/api", description: "Production" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js", "./src/models/*.js"],
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get("/api/docs.json", (req, res) => res.json(swaggerSpec));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  let dbMode = "unknown";
  try {
    const { getOfflineMode } = require("./config/db");
    dbMode = getOfflineMode() ? "offline (in-memory)" : "online (Atlas)";
  } catch (_) {}

  const mongoose = require("mongoose");
  const dbState = ["disconnected", "connected", "connecting", "disconnecting"][
    mongoose.connection.readyState
  ] || "unknown";

  res.json({
    success: true,
    message: "BIT Hostel API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0",
    database: {
      state: dbState,
      mode: dbMode,
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/students", require("./routes/student.routes"));
app.use("/api/wardens", require("./routes/warden.routes"));
app.use("/api/admins", require("./routes/admin.routes"));
app.use("/api/hostels", require("./routes/hostel.routes"));
app.use("/api/blocks", require("./routes/block.routes"));
app.use("/api/rooms", require("./routes/room.routes"));
app.use("/api/applications", require("./routes/application.routes"));
app.use("/api/allocations", require("./routes/allocation.routes"));
app.use("/api/compatibility", require("./routes/compatibility.routes"));
app.use("/api/complaints", require("./routes/complaint.routes"));
app.use("/api/leave", require("./routes/leave.routes"));
app.use("/api/visitors", require("./routes/visitor.routes"));
app.use("/api/notices", require("./routes/notice.routes"));
app.use("/api/payments", require("./routes/payment.routes"));
app.use("/api/documents", require("./routes/document.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/events", require("./routes/event.routes"));
app.use("/api/marketplace", require("./routes/marketplace.routes"));
app.use("/api/lost-found", require("./routes/lostfound.routes"));
app.use("/api/laundry", require("./routes/laundry.routes"));
app.use("/api/inventory", require("./routes/inventory.routes"));
app.use("/api/surveys", require("./routes/survey.routes"));
app.use("/api/analytics", require("./routes/analytics.routes"));
app.use("/api/reports", require("./routes/report.routes"));
app.use("/api/mess", require("./routes/mess.routes"));
app.use("/api/achievements", require("./routes/achievement.routes"));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(", ");
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please login again.";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired. Please login again.";
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} | ${statusCode} | ${err.stack}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;
