/**
 * @file Complaint.js
 * @description Complaint model with Kanban workflow.
 */
const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  student:    { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  allocation: { type: mongoose.Schema.Types.ObjectId, ref: "Allocation" },
  room:       { type: mongoose.Schema.Types.ObjectId, ref: "Room" },

  complaintNumber: { type: String, unique: true }, // Auto-generated e.g. CMP-2024-001

  type: {
    type: String,
    required: true,
    enum: ["water", "electricity", "internet", "furniture", "cleanliness", "food", "security", "noise", "maintenance", "others"],
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },

  title:       { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  images:      [{ type: String }], // Cloudinary URLs

  status: {
    type: String,
    enum: ["pending", "assigned", "in_progress", "resolved", "rejected", "closed"],
    default: "pending",
  },

  assignedTo:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedAt:   { type: Date },
  resolvedAt:   { type: Date },
  resolutionNote: { type: String },

  // ── Comment Thread ────────────────────────────────────────
  comments: [{
    author:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content:   { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    isInternal: { type: Boolean, default: false }, // Staff-only comment
  }],

  studentRating: { type: Number, min: 1, max: 5 },
  studentFeedback: { type: String },

  escalatedAt: { type: Date },
  dueDate:     { type: Date },
}, { timestamps: true });

complaintSchema.index({ student: 1, status: 1 });
complaintSchema.index({ status: 1, priority: 1 });
complaintSchema.index({ assignedTo: 1 });

// Auto-generate complaint number
complaintSchema.pre("save", async function (next) {
  if (!this.complaintNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Complaint").countDocuments();
    this.complaintNumber = `CMP-${year}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Complaint", complaintSchema);
