/**
 * @file logger.js
 * @description Winston logger configuration with daily rotating file transport.
 * Logs to console (dev) and rotating files (all environments).
 */

const { createLogger, format, transports } = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");

const { combine, timestamp, colorize, printf, json, errors } = format;

// ─── Log Directory ────────────────────────────────────────────────────────────
const LOG_DIR = path.join(process.cwd(), process.env.LOG_DIR || "logs");

// ─── Custom Console Format ────────────────────────────────────────────────────
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// ─── Environment Detection ───────────────────────────────────────────────────
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// ─── Rotating File Transport ──────────────────────────────────────────────────
const rotatingFileTransport = (filename, level) =>
  new DailyRotateFile({
    filename: path.join(LOG_DIR, `${filename}-%DATE%.log`),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    level,
  });

// ─── Active Transports ────────────────────────────────────────────────────────
const activeTransports = [
  new transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      consoleFormat
    ),
  }),
];

// In non-serverless environments with writable disk, enable rotating log files
if (!isServerless) {
  try {
    activeTransports.push(
      rotatingFileTransport("combined", "info"),
      rotatingFileTransport("error", "error")
    );
  } catch (_) {
    // Graceful fallback to console only
  }
}

// ─── Logger Instance ──────────────────────────────────────────────────────────
const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    json()
  ),
  transports: activeTransports,
  ...(!isServerless && {
    exceptionHandlers: [rotatingFileTransport("exceptions", "error")],
    rejectionHandlers: [rotatingFileTransport("rejections", "error")],
  }),
});

module.exports = logger;
