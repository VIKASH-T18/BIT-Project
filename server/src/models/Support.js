/**
 * @file Notice.js + Document.js + Warden.js + Admin.js
 * Remaining core models bundled for efficiency.
 */
const mongoose = require("mongoose");

// ─── Notice ───────────────────────────────────────────────────────────────────
const noticeSchema = new mongoose.Schema({
  author:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title:     { type: String, required: true, maxlength: 300 },
  content:   { type: String, required: true },
  category:  { type: String, enum: ["general", "urgent", "academic", "fees", "events", "rules", "maintenance"], default: "general" },
  priority:  { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal" },
  isPinned:  { type: Boolean, default: false },
  attachment:{ url: String, name: String, type: String },
  targetAudience: { type: String, enum: ["all", "boys", "girls", "final_year", "first_year"], default: "all" },
  targetHostel: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel" },
  likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  views:     { type: Number, default: 0 },
  expiresAt: { type: Date },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

noticeSchema.index({ createdAt: -1, isPinned: -1 });

// ─── Document ─────────────────────────────────────────────────────────────────
const documentSchema = new mongoose.Schema({
  student:  { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  docType: {
    type: String,
    required: true,
    enum: ["college_id", "aadhaar", "medical_certificate", "income_certificate", "tc", "photo", "other"],
  },
  fileName:  { type: String },
  fileUrl:   { type: String, required: true },
  publicId:  { type: String },
  fileSize:  { type: Number },
  mimeType:  { type: String },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  verifiedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  verifiedAt:  { type: Date },
  rejectionReason: { type: String },
}, { timestamps: true });

documentSchema.index({ student: 1, docType: 1 });

// ─── Warden ───────────────────────────────────────────────────────────────────
const wardenSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  employeeId:    { type: String, required: true, unique: true },
  designation:   { type: String },
  department:    { type: String },
  assignedHostel:{ type: mongoose.Schema.Types.ObjectId, ref: "Hostel" },
  assignedBlock: { type: mongoose.Schema.Types.ObjectId, ref: "Block" },
  phone:         { type: String },
  officeLocation:{ type: String },
  joiningDate:   { type: Date },
  isActive:      { type: Boolean, default: true },
}, { timestamps: true });

// ─── Admin ────────────────────────────────────────────────────────────────────
const adminSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  employeeId:  { type: String, required: true, unique: true },
  permissions: [{
    type: String,
    enum: ["manage_students", "manage_wardens", "manage_rooms", "manage_fees",
           "view_analytics", "export_reports", "manage_settings", "super_admin"],
  }],
  isSuperAdmin: { type: Boolean, default: false },
  department:   { type: String },
  phone:        { type: String },
  joiningDate:  { type: Date },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

// ─── AuditLog ─────────────────────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema({
  actor:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  actorRole:  { type: String },
  action:     { type: String, required: true },
  resource:   { type: String, required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  details:    { type: mongoose.Schema.Types.Mixed },
  ipAddress:  { type: String },
  userAgent:  { type: String },
  status:     { type: String, enum: ["success", "failure"], default: "success" },
}, { timestamps: true });

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = {
  Notice:    mongoose.model("Notice", noticeSchema),
  Document:  mongoose.model("Document", documentSchema),
  Warden:    mongoose.model("Warden", wardenSchema),
  Admin:     mongoose.model("Admin", adminSchema),
  AuditLog:  mongoose.model("AuditLog", auditLogSchema),
};
