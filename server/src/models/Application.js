/**
 * @file Application.js
 * @description Hostel application model — student's room application with priorities.
 */
const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  student:  { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  academicYear: { type: String, required: true }, // e.g. "2024-25"

  // ── Preferences ──────────────────────────────────────────
  preferredHostel: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel" },
  preferredBlock:  { type: mongoose.Schema.Types.ObjectId, ref: "Block" },
  preferredBlockCode: { type: String },
  preferredRoomType: {
    type: String,
    enum: ["single", "double", "triple", "four_sharing"],
    default: "double",
  },
  preferredAC: { type: Boolean, default: false },
  preferredFloor: { type: Number },

  // ── Priority Reasons ──────────────────────────────────────
  priorityReasons: {
    isFinalYear:    { type: Boolean, default: false },
    hasMedical:     { type: Boolean, default: false },
    hasDisability:  { type: Boolean, default: false },
    isScholarship:  { type: Boolean, default: false },
    distanceKm:     { type: Number, default: 0 },
    merits:         { type: String },
  },
  priorityScore:   { type: Number, default: 0 }, // Calculated by system

  // ── Roommate Preference ───────────────────────────────────
  preferredRoommate: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  preferredRoommateRegNo: { type: String },
  useAiMatching:   { type: Boolean, default: true },

  // ── Status ────────────────────────────────────────────────
  status: {
    type: String,
    enum: ["pending", "under_review", "approved", "rejected", "waitlisted", "allocated", "cancelled"],
    default: "pending",
  },

  // ── Admin/Warden Actions ──────────────────────────────────
  reviewedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt:    { type: Date },
  reviewComments: { type: String },
  rejectionReason: { type: String },
  waitlistPosition: { type: Number },

  // ── Documents ─────────────────────────────────────────────
  documents: [{
    docType: { type: String },
    fileUrl:  { type: String },
    uploadedAt: { type: Date, default: Date.now },
  }],

  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

applicationSchema.index({ student: 1, academicYear: 1 }, { unique: true });
applicationSchema.index({ status: 1 });
applicationSchema.index({ priorityScore: -1 });

module.exports = mongoose.model("Application", applicationSchema);
