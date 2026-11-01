/**
 * @file server.js
 * @description HTTP server entry point with Socket.IO integration.
 * Starts the Express app, connects to MongoDB (Atlas or in-memory fallback),
 * and initializes real-time features.
 *
 * Offline support:
 *  - If MongoDB Atlas is unreachable, the server automatically falls back to
 *    an in-memory MongoDB (mongodb-memory-server).
 *  - Demo accounts and sample data are seeded automatically in offline mode
 *    so the full application works without any internet connection.
 */

require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { getOfflineMode } = require("./config/db");
const { initializeSocket } = require("./sockets");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

// ─── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── Socket.IO Initialization ─────────────────────────────────────────────────
initializeSocket(server);

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    // Connect to MongoDB — Atlas first, then in-memory fallback
    await connectDB();

    const offline = getOfflineMode();

    if (offline) {
      logger.warn("╔══════════════════════════════════════════════════════╗");
      logger.warn("║  ⚠️   OFFLINE MODE — In-Memory MongoDB Active         ║");
      logger.warn("║  Atlas is unreachable. Data will NOT be persisted.   ║");
      logger.warn("║  Demo credentials will be seeded automatically.      ║");
      logger.warn("╚══════════════════════════════════════════════════════╝");
    }

    // Ensure demo accounts exist (works for both Atlas and in-memory)
    const ensureDemoAccounts = require("./utils/ensureDemoAccounts");
    ensureDemoAccounts().catch((e) =>
      logger.warn(`Demo accounts check notice: ${e.message}`)
    );

    server.listen(PORT, () => {
      logger.info(`🚀 BIT Hostel Server running on port ${PORT}`);
      logger.info(`📖 API Docs: http://localhost:${PORT}/api/docs`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV}`);
      if (offline) {
        logger.info(`📴 Mode: OFFLINE (in-memory MongoDB)`);
        logger.info(`   Login: admin@bitsathy.ac.in / Admin@2026`);
        logger.info(`   Login: warden.boysa@bitsathy.ac.in / Warden@2026`);
        logger.info(`   Login: student1@bitsathy.ac.in / Student@2026`);
      }
    });
  } catch (error) {
    logger.error(`❌ Failed to start server: ${error.message}`);
    logger.error(
      "   Fix: npm install mongodb-memory-server --save-dev  (for offline support)"
    );
    process.exit(1);
  }
};

// ─── Unhandled Promise Rejections ─────────────────────────────────────────────
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise} | Reason: ${reason}`);
  server.close(() => process.exit(1));
});

// ─── Uncaught Exceptions ──────────────────────────────────────────────────────
process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

startServer();
