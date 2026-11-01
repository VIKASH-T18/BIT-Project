/**
 * @file Visitor.js
 * @description Visitor pass model with QR verification and gate management.
 */
const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema({
  student:       { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  user:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  visitorNumber: { type: String },
  name:          { type: String },
  visitorName:   { type: String, required: true },
  phone:         { type: String },
  visitorPhone:  { type: String, required: true },
  relation:      { type: String, default: "parent" },
  relationship:  { type: String, default: "Parent" },
  idProofType:   { type: String, default: "Aadhaar" },
  idProofNumber: { type: String, default: "" },

  visitDate:        { type: Date, required: true, default: Date.now },
  expectedTimeIn:   { type: String, default: "10:00 AM" },
  expectedTimeOut:  { type: String, default: "05:00 PM" },
  visitPurpose:     { type: String, default: "Personal Visit" },
  purpose:          { type: String, default: "Personal Visit" },
  numberOfVisitors: { type: Number, default: 1, min: 1, max: 10 },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "checked_in", "checked_out", "expired", "completed"],
    default: "approved",
  },

  qrCode:      { type: String }, // QR code payload or pass token
  passExpiry:  { type: Date },   // Pass validity

  entryTime:   { type: Date },
  exitTime:    { type: Date },
  verifiedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedAt:      { type: Date },
  rejectionReason: { type: String },
  wardenRemarks:   { type: String },

  notes: { type: String },
}, { timestamps: true });

visitorSchema.index({ student: 1, visitDate: 1 });
visitorSchema.index({ user: 1, createdAt: -1 });
visitorSchema.index({ status: 1 });
visitorSchema.index({ visitDate: 1 });

module.exports = mongoose.model("Visitor", visitorSchema);
