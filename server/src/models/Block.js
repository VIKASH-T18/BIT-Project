/**
 * @file Block.js
 * @description Block model — hostel block within a hostel.
 */
const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema({
  hostel:      { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
  blockName:   { type: String, required: true, trim: true, uppercase: true },
  blockCode:   { type: String, trim: true, uppercase: true },
  totalFloors: { type: Number, required: true },
  totalRooms:  { type: Number, default: 0 },
  warden:      { type: mongoose.Schema.Types.ObjectId, ref: "Warden" },
  gender:      { type: String, enum: ["boys", "girls", "co_ed"] },
  isActive:    { type: Boolean, default: true },
  description: { type: String },
}, { timestamps: true });

blockSchema.index({ hostel: 1, blockName: 1 }, { unique: true });

blockSchema.virtual("floors", {
  ref: "Floor", localField: "_id", foreignField: "block",
});
blockSchema.set("toJSON", { virtuals: true });
blockSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Block", blockSchema);
