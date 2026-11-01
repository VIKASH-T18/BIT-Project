/**
 * @file Student.js
 * @description Student profile model — extends User with academic,
 * personal, and lifestyle information for AI compatibility matching.
 */

const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    // ── User Reference ─────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // ── Academic Details ───────────────────────────────────
    registerNumber: {
      type: String,
      required: [true, "Register number is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    rollNumber:  { type: String, trim: true },
    department:  {
      type: String,
      required: [true, "Department is required"],
      enum: [
        "CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIDS",
        "AIML", "CSD", "IoT", "CHEMICAL", "BIOTECH", "MBA", "MCA", "OTHER"
      ],
    },
    year:        { type: Number, required: true, min: 1, max: 5 },
    semester:    { type: Number, min: 1, max: 10 },
    section:     { type: String, uppercase: true },
    cgpa:        { type: Number, min: 0, max: 10 },
    admissionYear: { type: Number },

    // ── Personal Details ───────────────────────────────────
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other"],
    },
    dateOfBirth:  { type: Date },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    phone:        { type: String, trim: true },
    parentPhone:  { type: String, trim: true },
    nativeState:  { type: String, trim: true },
    nativeCity:   { type: String, trim: true },
    homeAddress:  { type: String },
    pincode:      { type: String },
    distanceFromCollege: { type: Number }, // km

    // ── Emergency Contact ──────────────────────────────────
    emergencyContact: {
      name:         { type: String },
      relation:     { type: String },
      phone:        { type: String },
      alternatePhone: { type: String },
    },

    // ── Parent Details ─────────────────────────────────────
    parentDetails: {
      fatherName:      { type: String },
      fatherOccupation: { type: String },
      fatherPhone:     { type: String },
      motherName:      { type: String },
      motherOccupation: { type: String },
      annualIncome:    { type: Number },
    },

    // ── Bio ────────────────────────────────────────────────
    bio:         { type: String, maxlength: 500 },
    languages:   [{ type: String }],
    hobbies:     [{ type: String }],

    // ── Hostel Status ──────────────────────────────────────
    isHostelStudent: { type: Boolean, default: false },
    hostelJoinDate:  { type: Date },
    hostelStatus: {
      type: String,
      enum: ["not_applied", "pending", "approved", "rejected", "waitlisted", "allocated", "checked_in", "checked_out"],
      default: "not_applied",
    },

    // ── Special Requirements ───────────────────────────────
    hasMedicalCondition: { type: Boolean, default: false },
    medicalDetails:      { type: String },
    hasDisability:       { type: Boolean, default: false },
    disabilityDetails:   { type: String },
    isScholarshipHolder: { type: Boolean, default: false },
    scholarshipDetails:  { type: String },

    // ── Profile Completion ─────────────────────────────────
    profileCompletion: { type: Number, default: 0, min: 0, max: 100 },
    completedSections: [{ type: String }],

    // ── Reward System ──────────────────────────────────────
    rewardPoints: { type: Number, default: 0 },
    badges:       [{ type: String }],
    leaderboardRank: { type: Number },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
studentSchema.index({ department: 1, year: 1 });
studentSchema.index({ hostelStatus: 1 });
studentSchema.index({ gender: 1 });

// ─── Virtual: Current Allocation ──────────────────────────────────────────────
studentSchema.virtual("currentAllocation", {
  ref:          "Allocation",
  localField:   "_id",
  foreignField: "student",
  justOne:      true,
  match:        { status: "active" },
});

// ─── Virtual: Compatibility Profile ──────────────────────────────────────────
studentSchema.virtual("compatibilityProfile", {
  ref:          "CompatibilityProfile",
  localField:   "_id",
  foreignField: "student",
  justOne:      true,
});

// ─── Pre-save: Calculate Profile Completion ───────────────────────────────────
studentSchema.pre("save", function (next) {
  const fields = [
    this.registerNumber, this.department, this.year, this.gender,
    this.phone, this.parentPhone, this.bloodGroup,
    this.homeAddress, this.emergencyContact?.name,
    this.languages?.length, this.hobbies?.length,
  ];
  const filled = fields.filter(Boolean).length;
  this.profileCompletion = Math.round((filled / fields.length) * 100);
  next();
});

module.exports = mongoose.model("Student", studentSchema);
