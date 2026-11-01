/**
 * @file Floor.js
 * @description Floor model within a block.
 */
const mongoose = require("mongoose");

const floorSchema = new mongoose.Schema({
  hostel:      { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
  block:       { type: mongoose.Schema.Types.ObjectId, ref: "Block",  required: true },
  floorNumber: { type: Number, required: true },
  floorName:   { type: String, trim: true }, // "Ground Floor", "First Floor", etc.
  totalRooms:  { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

floorSchema.index({ block: 1, floorNumber: 1 }, { unique: true });

floorSchema.virtual("rooms", {
  ref: "Room", localField: "_id", foreignField: "floor",
});
floorSchema.set("toJSON", { virtuals: true });
floorSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Floor", floorSchema);
