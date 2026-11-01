/**
 * @file auth.controller.js
 * @description Authentication controller — register, login, OTP, refresh, logout,
 * forgot/reset password, Google OAuth.
 */

const User = require("../models/User");
const Student = require("../models/Student");
const { Admin, Warden } = require("../models/Support");
const {
  generateAccessToken, generateRefreshToken, verifyRefreshToken,
  generateResetToken, setRefreshCookie, clearRefreshCookie,
} = require("../utils/jwt");
const {
  sendOtpEmail, sendPasswordResetEmail, sendWelcomeEmail,
} = require("../config/nodemailer");
const logger = require("../utils/logger");
const crypto = require("crypto");

// ─── Helper: Create token pair ────────────────────────────────────────────────
const createTokenPair = (user) => ({
  accessToken:  generateAccessToken({ userId: user._id, role: user.role, email: user.email }),
  refreshToken: generateRefreshToken({ userId: user._id }),
});

// ─── Helper: Safe user object ─────────────────────────────────────────────────
const safeUser = (user) => ({
  _id:          user._id,
  name:         user.name,
  email:        user.email,
  role:         user.role,
  isVerified:   user.isVerified,
  isActive:     user.isActive,
  avatar:       user.avatar,
  profileUrl:   user.profileUrl,
  lastLoginAt:  user.lastLoginAt,
  notificationPreferences: user.notificationPreferences,
});

// ─── Register ─────────────────────────────────────────────────────────────────
/**
 * @route   POST /api/auth/register
 * @desc    Register new user, create role profile, return token or OTP
 * @access  Public
 */
exports.register = async (req, res) => {
  const {
    name,
    email,
    password,
    role = "student",
    registerNumber,
    department,
    year,
    gender = "male",
    employeeId,
    phone,
  } = req.body;

  // Check existing user
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ success: false, message: "Email already registered." });
  }

  // Auto-verify in development or demo environment
  const isDevOrDemo =
    process.env.NODE_ENV === "development" ||
    !process.env.EMAIL_PASS ||
    process.env.EMAIL_PASS === "demo_pass";

  // Create user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role,
    isVerified: isDevOrDemo ? true : false,
  });

  // Create role-specific profile
  if (role === "student") {
    const regNo = (registerNumber || `REG${Date.now().toString().slice(-6)}`).toUpperCase();
    const existing = await Student.findOne({ registerNumber: regNo });
    if (existing) {
      await User.findByIdAndDelete(user._id);
      return res.status(400).json({ success: false, message: "Register number already exists." });
    }

    await Student.create({
      user: user._id,
      registerNumber: regNo,
      department: department || "CSE",
      year: year || 1,
      gender: gender || "male",
    });
  } else if (role === "warden") {
    const empId = (employeeId || `WRD-${Date.now().toString().slice(-4)}`).toUpperCase();
    await Warden.create({
      user: user._id,
      employeeId: empId,
      designation: "Hostel Warden",
      department: department || "Hostel Management",
      phone: phone || "9876543210",
      joiningDate: new Date(),
    });
  } else if (role === "admin") {
    const empId = (employeeId || `ADM-${Date.now().toString().slice(-4)}`).toUpperCase();
    await Admin.create({
      user: user._id,
      employeeId: empId,
      permissions: [
        "manage_students",
        "manage_wardens",
        "manage_rooms",
        "manage_fees",
        "view_analytics",
        "export_reports",
        "manage_settings",
      ],
      department: department || "Hostel Administration",
      phone: phone || "9876543210",
      joiningDate: new Date(),
    });
  }

  // Generate OTP
  const otp = user.generateOtp();
  await user.save({ validateBeforeSave: false });

  // Send OTP email
  try {
    await sendOtpEmail(email, name, otp);
  } catch (emailError) {
    logger.warn(`OTP email notice for ${email}: ${emailError.message}`);
  }

  logger.info(`New user registered: ${email} (${role}) | Verified: ${user.isVerified}`);

  // If verified, generate tokens for immediate login
  if (user.isVerified) {
    const { accessToken, refreshToken } = createTokenPair(user);
    user.addRefreshToken(refreshToken);
    user.lastLoginAt = new Date();
    user.loginCount = 1;
    await user.save({ validateBeforeSave: false });

    setRefreshCookie(res, refreshToken);

    let profile = null;
    if (user.role === "student") {
      profile = await Student.findOne({ user: user._id });
    }

    return res.status(201).json({
      success: true,
      message: "Account created successfully! Welcome to BIT Hostel Portal.",
      data: {
        user: safeUser(user),
        accessToken,
        profile,
        isVerified: true,
        otp,
      },
    });
  }

  res.status(201).json({
    success: true,
    message: "Registration successful! Please check your email for the OTP.",
    data: { userId: user._id, email: user.email, role: user.role, otp },
  });
};

// ─── Verify Email OTP ─────────────────────────────────────────────────────────
/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with OTP
 * @access  Public
 */
exports.verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select("+otp");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  if (user.isVerified) {
    // Generate tokens anyway so user is logged in
    const { accessToken, refreshToken } = createTokenPair(user);
    user.addRefreshToken(refreshToken);
    await user.save({ validateBeforeSave: false });
    setRefreshCookie(res, refreshToken);

    return res.json({
      success: true,
      message: "Email is already verified. Logging you in...",
      data: { user: safeUser(user), accessToken },
    });
  }

  const { valid, reason } = user.verifyOtp(otp);
  if (!valid) {
    await user.save({ validateBeforeSave: false });
    return res.status(400).json({ success: false, message: reason });
  }

  user.isVerified = true;
  await user.save({ validateBeforeSave: false });

  // Send welcome email
  try {
    await sendWelcomeEmail(email, user.name);
  } catch {}

  // Generate tokens for auto-login
  const { accessToken, refreshToken } = createTokenPair(user);
  user.addRefreshToken(refreshToken);
  user.lastLoginAt = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, refreshToken);

  res.json({
    success: true,
    message: "Email verified successfully! Welcome to BIT Hostel Portal.",
    data: { user: safeUser(user), accessToken },
  });
};

// ─── Login ────────────────────────────────────────────────────────────────────
/**
 * @route   POST /api/auth/login
 * @desc    Login with email/password, returns JWT tokens
 * @access  Public
 */
exports.login = async (req, res) => {
  const { email, password, rememberMe = false } = req.body;

  const user = await User.findByCredentials(email, password);

  if (!user.isVerified) {
    const isDevOrDemo =
      process.env.NODE_ENV === "development" ||
      !process.env.EMAIL_PASS ||
      process.env.EMAIL_PASS === "demo_pass";

    if (isDevOrDemo) {
      user.isVerified = true;
      await user.save({ validateBeforeSave: false });
    } else {
      // Resend OTP
      const otp = user.generateOtp();
      await user.save({ validateBeforeSave: false });
      try { await sendOtpEmail(email, user.name, otp); } catch {}
      return res.status(403).json({
        success: false,
        message: "Email not verified. A new OTP has been sent.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }
  }

  const { accessToken, refreshToken } = createTokenPair(user);

  // Store refresh token (supports multiple devices)
  user.addRefreshToken(refreshToken);
  user.lastLoginAt = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, refreshToken);

  logger.info(`User logged in: ${email}`);

  // Fetch role-specific profile so frontend gets fresh profile on login immediately
  let profile = null;
  if (user.role === "student") {
    profile = await Student.findOne({ user: user._id });
  } else if (user.role === "warden") {
    profile = await Warden.findOne({ user: user._id });
  } else if (user.role === "admin") {
    profile = await Admin.findOne({ user: user._id });
  }

  res.json({
    success: true,
    message: "Login successful!",
    data: { user: safeUser(user), accessToken, profile },
  });
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
/**
 * @route   POST /api/auth/refresh
 * @desc    Get new access token using refresh token cookie
 * @access  Public
 */
exports.refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ success: false, message: "Refresh token not found." });
  }

  const decoded = verifyRefreshToken(token);

  const user = await User.findById(decoded.userId).select("+refreshTokens");
  if (!user || !user.refreshTokens.includes(token)) {
    return res.status(401).json({ success: false, message: "Invalid refresh token." });
  }

  // Rotate refresh token
  user.removeRefreshToken(token);
  const { accessToken, refreshToken: newRefreshToken } = createTokenPair(user);
  user.addRefreshToken(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, newRefreshToken);

  res.json({ success: true, data: { accessToken } });
};

// ─── Logout ───────────────────────────────────────────────────────────────────
/**
 * @route   POST /api/auth/logout
 * @desc    Logout — invalidate refresh token
 * @access  Private
 */
exports.logout = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await User.findById(decoded.userId).select("+refreshTokens");
      if (user) {
        user.removeRefreshToken(token);
        await user.save({ validateBeforeSave: false });
      }
    } catch {
      // Token invalid or expired — still clear the cookie
    }
  }

  clearRefreshCookie(res);

  res.json({ success: true, message: "Logged out successfully." });
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    return res.json({
      success: true,
      message: "If that email is registered, a reset link has been sent.",
    });
  }

  const resetToken = generateResetToken(user._id.toString());
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1hr
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(email, user.name, resetUrl);
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new Error("Failed to send reset email. Please try again.");
  }

  res.json({ success: true, message: "Password reset link sent to your email." });
};

// ─── Reset Password ───────────────────────────────────────────────────────────
/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+password");

  if (!user) {
    return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
  }

  user.password = newPassword;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  // Invalidate all refresh tokens on password change
  user.refreshTokens = [];
  await user.save();

  clearRefreshCookie(res);

  res.json({ success: true, message: "Password reset successful. Please login with your new password." });
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
/**
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
exports.resendOtp = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select("+otp");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  if (user.isVerified) {
    return res.status(400).json({ success: false, message: "Email already verified." });
  }

  // Rate limit: block if attempts > 3 in last 10min
  if (user.otp?.attempts >= 3 && user.otp?.expiresAt > new Date()) {
    return res.status(429).json({ success: false, message: "Too many OTP requests. Try again in 10 minutes." });
  }

  const otp = user.generateOtp();
  await user.save({ validateBeforeSave: false });
  await sendOtpEmail(email, user.name, otp);

  res.json({ success: true, message: "New OTP sent to your email." });
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id);

  // Fetch role-specific profile
  let profile = null;
  if (user.role === "student") {
    profile = await Student.findOne({ user: user._id });
  } else if (user.role === "warden") {
    profile = await Warden.findOne({ user: user._id });
  } else if (user.role === "admin") {
    profile = await Admin.findOne({ user: user._id });
  }

  res.json({
    success: true,
    data: { user: safeUser(user), profile },
  });
};

// ─── Change Password ──────────────────────────────────────────────────────────
/**
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return res.status(400).json({ success: false, message: "Current password is incorrect." });
  }

  user.password = newPassword;
  user.refreshTokens = []; // Logout all devices
  await user.save();

  clearRefreshCookie(res);

  res.json({ success: true, message: "Password changed. Please login again." });
};
