/**
 * @file jwt.js
 * @description JWT utility functions — generate and verify access/refresh tokens.
 */

const jwt = require("jsonwebtoken");

/**
 * Generate a JWT access token (short-lived).
 * @param {object} payload - Token payload (userId, role)
 * @returns {string} Signed JWT access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || "15m",
    issuer: "bit-hostel-system",
    audience: "bit-hostel-client",
  });
};

/**
 * Generate a JWT refresh token (long-lived).
 * @param {object} payload - Token payload (userId)
 * @returns {string} Signed JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
    issuer: "bit-hostel-system",
    audience: "bit-hostel-client",
  });
};

/**
 * Verify a JWT access token.
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
    issuer: "bit-hostel-system",
    audience: "bit-hostel-client",
  });
};

/**
 * Verify a JWT refresh token.
 * @param {string} token
 * @returns {object} Decoded payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: "bit-hostel-system",
    audience: "bit-hostel-client",
  });
};

/**
 * Generate a password reset token (one-time, 1hr expiry).
 * @param {string} userId
 * @returns {string}
 */
const generateResetToken = (userId) => {
  return jwt.sign({ userId, type: "password_reset" }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "1h",
  });
};

/**
 * Set secure HTTP-only refresh token cookie.
 * @param {object} res - Express response object
 * @param {string} refreshToken
 */
const setRefreshCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth/refresh",
  });
};

/**
 * Clear the refresh token cookie.
 * @param {object} res - Express response object
 */
const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/api/auth/refresh",
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateResetToken,
  setRefreshCookie,
  clearRefreshCookie,
};
