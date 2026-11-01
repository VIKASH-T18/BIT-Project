/**
 * @file Allocation.js
 * @description Room allocation record — links student to room and bed.
 */
const mongoose = require("mongoose");

const allocationSchema = new mongoose.Schema({
  student:     { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  application: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
  hostel:      { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
  block:       { type: mongoose.Schema.Types.ObjectId, ref: "Block",  required: true },
  floor:       { type: mongoose.Schema.Types.ObjectId, ref: "Floor",  required: true },
  room:        { type: mongoose.Schema.Types.ObjectId, ref: "Room",   required: true },
  bedNumber:   { type: String, required: true },
  academicYear: { type: String, required: true },

  status: {
    type: String,
    enum: ["active", "vacated", "transferred", "terminated"],
    default: "active",
  },

  allocationDate:  { type: Date, default: Date.now },
  checkInDate:     { type: Date },
  checkOutDate:    { type: Date },
  vacatedAt:       { type: Date },

  allocatedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  transferredTo:   { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  transferReason:  { type: String },

  qrCode:          { type: String }, // QR code data URL
  receiptUrl:      { type: String },

  notes:           { type: String },
}, { timestamps: true });

allocationSchema.index({ student: 1, academicYear: 1 }, { unique: true });
allocationSchema.index({ room: 1, status: 1 });
allocationSchema.index({ status: 1 });

module.exports = mongoose.model("Allocation", allocationSchema);
