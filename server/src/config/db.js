/**
 * @file db.js
 * @description MongoDB connection configuration using Mongoose.
 * Strategy:
 *  1. Try connecting to MongoDB Atlas (MONGODB_URI in .env)
 *  2. If Atlas is unreachable/offline, automatically fall back to an
 *     in-memory MongoDB instance (mongodb-memory-server) so the full
 *     app works 100% offline — all API routes, login, seeded demo data, etc.
 *  3. On successful in-memory start, demo data is auto-seeded via
 *     ensureDemoAccounts so you can immediately log in without any manual step.
 */

const dns = require("dns");
const dnsPromises = require("dns").promises;
// Override DNS resolvers so Atlas SRV lookups succeed on most networks
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
  dnsPromises.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  // fallback to system resolver
}

const mongoose = require("mongoose");
const logger = require("../utils/logger");

// Track whether we are running in in-memory mode so other modules can check
let isOfflineMode = false;
let memoryServer = null; // holds the MongoMemoryServer instance

/**
 * Attempt to connect to the given URI with a short timeout.
 * Returns true on success, false on failure.
 */
async function tryConnect(uri, options) {
  try {
    const conn = await mongoose.connect(uri, options);
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    logger.warn(`⚠️  MongoDB connection failed: ${err.message}`);
    return false;
  }
}

/**
 * Start an in-memory MongoDB instance and connect to it.
 * Falls back gracefully if mongodb-memory-server is not installed.
 * @returns {Promise<boolean>} true if successful
 */
async function startInMemoryMongo() {
  try {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    logger.info("🔄 Starting in-memory MongoDB (offline mode)...");
    memoryServer = await MongoMemoryServer.create({
      instance: { dbName: "bit_hostel" },
    });
    const uri = memoryServer.getUri();
    await mongoose.connect(uri, { dbName: "bit_hostel" });
    logger.info("✅ In-memory MongoDB started — app running in OFFLINE mode");
    logger.info(`   URI: ${uri}`);
    isOfflineMode = true;
    return true;
  } catch (err) {
    logger.error(`❌ Failed to start in-memory MongoDB: ${err.message}`);
    logger.error(
      "   Run: npm install mongodb-memory-server --save-dev  in the server folder"
    );
    return false;
  }
}

/**
 * Connect to MongoDB database.
 * Tries Atlas first; falls back to in-memory MongoDB if Atlas is offline.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  const atlasOptions = {
    serverSelectionTimeoutMS: 8000,  // Reduced to 8s for faster offline detection
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,
    connectTimeoutMS: 8000,
    maxPoolSize: 10,
  };

  const atlasUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/bit_hostel";

  logger.info("🔌 Connecting to MongoDB Atlas...");
  const atlasSuccess = await tryConnect(atlasUri, atlasOptions);

  if (atlasSuccess) {
    isOfflineMode = false;
    return; // All good — Atlas is available
  }

  // Atlas is down — switch to in-memory MongoDB
  logger.warn("🌐 Atlas unreachable — switching to offline in-memory mode");
  const memSuccess = await startInMemoryMongo();

  if (!memSuccess) {
    // Absolute last resort: try plain localhost MongoDB if installed
    logger.warn("⚠️  Trying localhost MongoDB as last resort...");
    const localSuccess = await tryConnect(
      "mongodb://localhost:27017/bit_hostel",
      { serverSelectionTimeoutMS: 5000 }
    );

    if (!localSuccess) {
      logger.error(
        "❌ No MongoDB available (Atlas offline, no local MongoDB, no in-memory server)."
      );
      logger.error(
        "   To fix: install mongodb-memory-server with  npm install mongodb-memory-server --save-dev"
      );
      throw new Error(
        "No MongoDB available. Install mongodb-memory-server for offline support."
      );
    }
  }
};

/**
 * Returns true when the server is running with in-memory MongoDB.
 * Useful for logging / health-check endpoints.
 */
const getOfflineMode = () => isOfflineMode;

/**
 * Gracefully stop the in-memory server (called on shutdown).
 */
const stopMemoryServer = async () => {
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
    logger.info("In-memory MongoDB stopped.");
  }
};

// ─── Mongoose Event Listeners ─────────────────────────────────────────────────

mongoose.connection.on("disconnected", () => {
  if (!isOfflineMode) {
    logger.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
  }
});

mongoose.connection.on("reconnected", () => {
  logger.info("✅ MongoDB reconnected successfully.");
});

mongoose.connection.on("error", (err) => {
  logger.error(`❌ MongoDB Error: ${err.message}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  await stopMemoryServer();
  logger.info("MongoDB connection closed through app termination (SIGINT)");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await mongoose.connection.close();
  await stopMemoryServer();
  logger.info("MongoDB connection closed through app termination (SIGTERM)");
  process.exit(0);
});

module.exports = connectDB;
module.exports.getOfflineMode = getOfflineMode;
module.exports.stopMemoryServer = stopMemoryServer;
