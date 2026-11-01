/**
 * @file User.js
 * @description Core User model — base for Student, Warden, Admin roles.
 * Handles authentication, OTP, refresh tokens, and password hashing.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { hotp } = require("otplib");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required: [name, email, password, role]
 *       properties:
 *         name:       { type: string }
 *         email:      { type: string, format: email }
 *         role:       { type: string, enum: [student, warden, admin] }
 *         isVerified: { type: boolean }
 *         isActive:   { type: boolean }
 */
const userSchema = new mongoose.Schema(
  {
    // ── Identity ───────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must be less than 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never return password in queries
    },

    // ── Role & Status ──────────────────────────────────────
    role: {
      type: String,
      enum: ["student", "warden", "admin"],
      default: "student",
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // ── Profile Picture ────────────────────────────────────
    avatar: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    // ── OTP (Email Verification / OTP Login) ───────────────
    otp: {
      code: { type: String, select: false },
      expiresAt: { type: Date, select: false },
      attempts: { type: Number, default: 0 },
    },

    // ── Password Reset ─────────────────────────────────────
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // ── Auth ───────────────────────────────────────────────
    refreshTokens: [{ type: String, select: false }], // Supports multi-device
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },

    // ── Google OAuth ───────────────────────────────────────
    googleId: { type: String, select: false },

    // ── Notification Preferences ───────────────────────────
    notificationPreferences: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },

    // ── Session ────────────────────────────────────────────
    sessionTimeout: { type: Number, default: 30 }, // minutes
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });

// ─── Virtual: Profile Link ────────────────────────────────────────────────────
userSchema.virtual("profileUrl").get(function () {
  return this.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=2563eb&color=fff`;
});

// ─── Pre-save: Hash Password ──────────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance Method: Compare Password ───────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance Method: Generate OTP (otplib HOTP) ─────────────────────────────
userSchema.methods.generateOtp = function () {
  // Use HOTP with a timestamp-based counter for secure, non-predictable OTPs
  const secret = require("crypto").randomBytes(20).toString("hex").toUpperCase();
  const counter = Math.floor(Date.now() / 1000);
  hotp.options = { digits: 6 };
  const otp = hotp.generate(secret, counter);
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000),
    attempts: 0,
  };
  return otp;
};

// ─── Instance Method: Verify OTP ─────────────────────────────────────────────
userSchema.methods.verifyOtp = function (inputOtp) {
  if (!this.otp?.code) return { valid: false, reason: "No OTP generated" };
  if (this.otp.expiresAt < new Date()) return { valid: false, reason: "OTP expired" };
  if (this.otp.attempts >= 5) return { valid: false, reason: "Too many attempts" };
  this.otp.attempts += 1;
  if (this.otp.code !== inputOtp) return { valid: false, reason: "Invalid OTP" };
  this.otp = {}; // Clear OTP after successful verification
  return { valid: true };
};

// ─── Instance Method: Add Refresh Token ──────────────────────────────────────
userSchema.methods.addRefreshToken = function (token) {
  // Guard: refreshTokens may be excluded by select:false
  if (!Array.isArray(this.refreshTokens)) this.refreshTokens = [];
  // Keep max 5 refresh tokens (5 devices)
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens.shift();
  }
  this.refreshTokens.push(token);
};

// ─── Instance Method: Remove Refresh Token ───────────────────────────────────
userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter((t) => t !== token);
};

// ─── Static: Find by Credentials ─────────────────────────────────────────────
userSchema.statics.findByCredentials = async function (email, password) {
  // Also select refreshTokens so addRefreshToken works correctly
  const user = await this.findOne({ email, isActive: true }).select("+password +refreshTokens");
  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }
  return user;
};

module.exports = mongoose.model("User", userSchema);
