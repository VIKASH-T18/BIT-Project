/**
 * @file auth.routes.js
 * @description Authentication routes.
 */

const router = require("express").Router();
const {
  register, verifyEmail, login, refreshToken, logout,
  forgotPassword, resetPassword, resendOtp, getMe, changePassword,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { body } = require("express-validator");
const { validateRequest } = require("../middleware/validate.middleware");

// ─── Validation Schemas ───────────────────────────────────────────────────────

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["student", "warden", "admin"]).withMessage("Invalid role"),
  body("registerNumber").optional().trim(),
  body("department").optional().trim(),
  body("year").optional().isInt({ min: 1, max: 5 }).withMessage("Year must be 1–5"),
  body("gender").optional().isIn(["male", "female", "other"]).withMessage("Gender must be male, female, or other"),
];

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password required"),
];

const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Reset token required"),
  body("newPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:           { type: string }
 *               email:          { type: string, format: email }
 *               password:       { type: string, minLength: 8 }
 *               role:           { type: string, enum: [student, warden, admin] }
 *               registerNumber: { type: string }
 *               department:     { type: string }
 *               year:           { type: integer }
 *               gender:         { type: string }
 *     responses:
 *       201: { description: User registered, OTP sent }
 *       400: { description: Validation error or email exists }
 */
router.post("/register", registerValidation, validateRequest, register);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email with OTP
 *     tags: [Authentication]
 *     security: []
 */
router.post("/verify-email", [
  body("email").isEmail().normalizeEmail(),
  body("otp").isLength({ min: 6, max: 6 }).isNumeric().withMessage("OTP must be 6 digits"),
], validateRequest, verifyEmail);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     security: []
 */
router.post("/login", loginValidation, validateRequest, login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Get new access token using refresh cookie
 *     tags: [Authentication]
 *     security: []
 */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout and invalidate refresh token
 *     tags: [Authentication]
 */
router.post("/logout", logout);

router.post("/forgot-password", [
  body("email").isEmail().normalizeEmail(),
], validateRequest, forgotPassword);

router.post("/reset-password", resetPasswordValidation, validateRequest, resetPassword);

router.post("/resend-otp", [
  body("email").isEmail().normalizeEmail(),
], validateRequest, resendOtp);

router.get("/me", authenticate, getMe);

router.put("/change-password", authenticate, [
  body("currentPassword").notEmpty(),
  body("newPassword").isLength({ min: 8 }),
], validateRequest, changePassword);

module.exports = router;
