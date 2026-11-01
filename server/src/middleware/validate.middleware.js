/**
 * @file validate.middleware.js
 * @description Express-validator result handler middleware.
 */
const { validationResult } = require("express-validator");

/**
 * Middleware to check express-validator results and return 400 on errors.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { validateRequest };
