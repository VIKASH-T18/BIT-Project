/**
 * @file MessMenu.js
 * @description Mongoose model for the weekly hostel mess menu.
 * Admin or Warden can update the menu once per week. Students view it read-only.
 */

const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema(
  {
    items: { type: String, default: "" },       // comma-separated food items
    time:  { type: String, default: "" },       // e.g. "07:30 - 09:00"
  },
  { _id: false }
);

const dayMenuSchema = new mongoose.Schema(
  {
    breakfast: { type: mealSchema, default: () => ({}) },
    lunch:     { type: mealSchema, default: () => ({}) },
    dinner:    { type: mealSchema, default: () => ({}) },
  },
  { _id: false }
);

const messMenuSchema = new mongoose.Schema(
  {
    weekStartDate: {
      type: Date,
      required: true,
      index: true,
    },
    weekLabel: {
      type: String,
      default: "",   // e.g. "Oct 21 – Oct 27, 2026"
    },
    menu: {
      Monday:    { type: dayMenuSchema, default: () => ({}) },
      Tuesday:   { type: dayMenuSchema, default: () => ({}) },
      Wednesday: { type: dayMenuSchema, default: () => ({}) },
      Thursday:  { type: dayMenuSchema, default: () => ({}) },
      Friday:    { type: dayMenuSchema, default: () => ({}) },
      Saturday:  { type: dayMenuSchema, default: () => ({}) },
      Sunday:    { type: dayMenuSchema, default: () => ({}) },
    },
    updatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedByName: { type: String, default: "" },
    isActive:   { type: Boolean, default: true },
    notes:      { type: String, default: "" },   // e.g. "Special feast on Thursday"
  },
  { timestamps: true }
);

// Only one active menu at a time
messMenuSchema.index({ isActive: 1, weekStartDate: -1 });

module.exports = mongoose.model("MessMenu", messMenuSchema);
