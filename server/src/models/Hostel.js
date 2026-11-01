/**
 * @file Hostel.js
 * @description Hostel model — top-level hostel entity.
 */
const mongoose = require("mongoose");

const hostelSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  type:        { type: String, enum: ["boys", "girls", "co_ed"], required: true },
  description: { type: String },
  totalCapacity: { type: Number, default: 0 },
  currentOccupancy: { type: Number, default: 0 },
  warden:      { type: mongoose.Schema.Types.ObjectId, ref: "Warden" },
  contactPhone: { type: String },
  contactEmail: { type: String },
  address:     { type: String },
  amenities:   [{ type: String }],
  rules:       [{ type: String }],
  images:      [{ type: String }],
  isActive:    { type: Boolean, default: true },
  establishedYear: { type: Number },
}, { timestamps: true });

hostelSchema.virtual("blocks", {
  ref: "Block", localField: "_id", foreignField: "hostel",
});
hostelSchema.set("toJSON", { virtuals: true });
hostelSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Hostel", hostelSchema);
