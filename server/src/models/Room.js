/**
 * @file Room.js
 * @description Room model — hostel rooms with capacity, type, occupancy, and status.
 */

const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    // ── References ─────────────────────────────────────────
    hostel: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
    block:  { type: mongoose.Schema.Types.ObjectId, ref: "Block",  required: true },
    floor:  { type: mongoose.Schema.Types.ObjectId, ref: "Floor",  required: true },

    // ── Room Identity ──────────────────────────────────────
    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      trim: true,
      uppercase: true,
    },
    floorNumber: { type: Number, required: true },

    // ── Room Type ──────────────────────────────────────────
    roomType: {
      type: String,
      required: true,
      enum: ["single", "double", "triple", "four_sharing"],
    },
    isAC: { type: Boolean, default: false },

    // ── Capacity & Occupancy ───────────────────────────────
    capacity:       { type: Number, required: true, min: 1, max: 6 },
    currentOccupancy: { type: Number, default: 0, min: 0 },

    // ── Occupants ──────────────────────────────────────────
    occupants: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        bedNumber: { type: String },
        allocatedAt: { type: Date, default: Date.now },
      }
    ],

    // ── Status ────────────────────────────────────────────
    status: {
      type: String,
      enum: ["available", "partially_occupied", "fully_occupied", "maintenance", "reserved", "closed"],
      default: "available",
    },

    // ── Amenities ──────────────────────────────────────────
    amenities: {
      fan:      { type: Number, default: 0 },
      table:    { type: Number, default: 0 },
      chair:    { type: Number, default: 0 },
      wardrobe: { type: Number, default: 0 },
      bed:      { type: Number, default: 0 },
      ac:       { type: Number, default: 0 },
      attached_bathroom: { type: Boolean, default: false },
      balcony:  { type: Boolean, default: false },
      wifi:     { type: Boolean, default: true },
    },

    // ── Fees ──────────────────────────────────────────────
    monthlyFee:   { type: Number, required: true },
    securityDeposit: { type: Number, default: 0 },

    // ── Metadata ──────────────────────────────────────────
    qrCode:       { type: String }, // QR code URL for room
    images:       [{ type: String }],
    description:  { type: String, maxlength: 500 },
    notes:        { type: String },
    lastCleaned:  { type: Date },
    maintenanceHistory: [
      {
        date:        { type: Date },
        description: { type: String },
        resolvedBy:  { type: String },
      }
    ],
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
roomSchema.index({ block: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ status: 1 });
roomSchema.index({ roomType: 1, isAC: 1 });
roomSchema.index({ hostel: 1, status: 1 });

// ─── Virtual: Available Beds ──────────────────────────────────────────────────
roomSchema.virtual("availableBeds").get(function () {
  return this.capacity - this.currentOccupancy;
});

roomSchema.virtual("occupancyPercentage").get(function () {
  return Math.round((this.currentOccupancy / this.capacity) * 100);
});

// ─── Pre-save: Auto-update Status ────────────────────────────────────────────
roomSchema.pre("save", function (next) {
  this.currentOccupancy = this.occupants.length;
  if (this.currentOccupancy === 0) {
    this.status = "available";
  } else if (this.currentOccupancy >= this.capacity) {
    this.status = "fully_occupied";
  } else {
    this.status = "partially_occupied";
  }
  next();
});

module.exports = mongoose.model("Room", roomSchema);
