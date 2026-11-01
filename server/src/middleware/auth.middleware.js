/**
 * @file auth.middleware.js
 * @description Authentication and Role-Based Access Control middleware.
 */

const { verifyAccessToken } = require("../utils/jwt");
const User = require("../models/User");
const { AuditLog } = require("../models/Support");
const logger = require("../utils/logger");

// ─── Authenticate: Verify JWT ─────────────────────────────────────────────────

/**
 * Middleware to verify JWT access token from Authorization header.
 * Attaches decoded user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token required. Please login.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    // Fetch fresh user from DB (checks isActive, role changes)
    // Note: password, refreshTokens, otp.code already have select: false in schema
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found." });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated. Contact admin." });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error(`[Auth] authenticate failure: ${error.name} - ${error.message}`);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired. Please refresh.", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ success: false, message: "Invalid token.", reason: error.message });
  }
};

// ─── Role Authorization ───────────────────────────────────────────────────────

/**
 * Middleware factory for role-based access control.
 * @param {...string} roles - Allowed roles
 * @returns {function} Express middleware
 *
 * @example
 * router.get("/admin/stats", authenticate, authorize("admin"), getStats);
 * router.get("/dashboard", authenticate, authorize("admin", "warden"), getDashboard);
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} role is not authorized for this action.`,
      });
    }
    next();
  };
};

// ─── Verified Email Check ─────────────────────────────────────────────────────

/**
 * Middleware to ensure user's email is verified before accessing protected routes.
 */
const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Email verification required. Please verify your email address.",
      code: "EMAIL_NOT_VERIFIED",
    });
  }
  next();
};

// ─── Optional Auth ────────────────────────────────────────────────────────────

/**
 * Middleware that optionally authenticates — doesn't fail if no token.
 * Used for public routes that show more data when logged in.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return next();

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    req.user = await User.findById(decoded.userId).select("-password");
  } catch {
    // Silently fail — user is just anonymous
  }
  next();
};

// ─── Audit Logger Middleware ──────────────────────────────────────────────────

/**
 * Middleware factory to log admin actions to AuditLog collection.
 * @param {string} action - Action description
 * @param {string} resource - Resource being acted on
 */
const auditLog = (action, resource) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      if (res.statusCode < 400 && req.user) {
        try {
          await AuditLog.create({
            actor:      req.user._id,
            actorRole:  req.user.role,
            action,
            resource,
            resourceId: req.params.id || data?.data?._id,
            details:    { method: req.method, url: req.originalUrl, body: req.body },
            ipAddress:  req.ip || req.connection.remoteAddress,
            userAgent:  req.headers["user-agent"],
            status:     "success",
          });
        } catch (err) {
          logger.warn(`Audit log failed: ${err.message}`);
        }
      }
      return originalJson(data);
    };
    next();
  };
};

module.exports = { authenticate, authorize, requireVerified, optionalAuth, auditLog };
