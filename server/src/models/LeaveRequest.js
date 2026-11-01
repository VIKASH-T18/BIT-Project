/**
 * @file LeaveRequest.js
 * @description Leave request model with approval workflow.
 */
const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema({
  student:  { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  leaveNumber: { type: String, unique: true },

  leaveType: {
    type: String,
    required: true,
    default: "home_visit",
  },
  fromDate:    { type: Date, required: true },
  toDate:      { type: Date, required: true },
  noOfDays:    { type: Number },
  reason:      { type: String, default: "Personal Leave", maxlength: 1000 },
  destination: { type: String, default: "Home / Outstation" },

  // ── Status ────────────────────────────────────────────────
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled"],
    default: "pending",
  },
  approvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedAt:    { type: Date },
  rejectionReason: { type: String },

  // ── Gate Pass ─────────────────────────────────────────────
  gatePassQr: { type: String },
  gatePassExpiry: { type: Date },

  // ── Return ────────────────────────────────────────────────
  actualReturnDate: { type: Date },
  isLateReturn:     { type: Boolean, default: false },

  parentConsent: { type: Boolean, default: false },
  emergencyPhone: { type: String },
}, { timestamps: true });

leaveRequestSchema.index({ student: 1, status: 1 });
leaveRequestSchema.index({ fromDate: 1, toDate: 1 });

leaveRequestSchema.pre("save", async function (next) {
  if (!this.leaveNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("LeaveRequest").countDocuments();
    this.leaveNumber = `LVR-${year}-${String(count + 1).padStart(4, "0")}`;
  }
  if (this.fromDate && this.toDate) {
    const diff = (this.toDate - this.fromDate) / (1000 * 60 * 60 * 24);
    this.noOfDays = Math.ceil(diff) + 1;
  }
  next();
});

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
