/**
 * @file Extra.js
 * @description Extra models: Event, MarketplaceItem, LostFoundItem, LaundryBooking, Inventory, Survey
 */
const mongoose = require("mongoose");

// ─── Event ────────────────────────────────────────────────────────────────────
const eventSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  type:        { type: String, enum: ["sports", "cultural", "workshop", "meeting", "other"], required: true },
  eventDate:   { type: Date, required: true },
  location:    { type: String },
  organizer:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  maxCapacity: { type: Number },
  registrations: [{ student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" }, registeredAt: Date }],
  attendees:   [{ student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" }, attendedAt: Date }],
  images:      [{ type: String }],
  isPublished: { type: Boolean, default: false },
  hostel:      { type: mongoose.Schema.Types.ObjectId, ref: "Hostel" },
}, { timestamps: true });

// ─── MarketplaceItem ──────────────────────────────────────────────────────────
const marketplaceItemSchema = new mongoose.Schema({
  seller:      { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  title:       { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 1000 },
  price:       { type: Number, required: true, min: 0 },
  category: {
    type: String,
    enum: ["books", "electronics", "furniture", "clothing", "sports", "stationery", "transport", "other"],
    required: true,
  },
  condition:   { type: String, enum: ["new", "like_new", "good", "fair", "poor"], default: "good" },
  images:      [{ type: String }],
  status:      { type: String, enum: ["available", "sold", "reserved", "inactive"], default: "available" },
  buyer:       { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  views:       { type: Number, default: 0 },
  isNegotiable:{ type: Boolean, default: true },
}, { timestamps: true });

marketplaceItemSchema.index({ seller: 1, status: 1 });
marketplaceItemSchema.index({ category: 1, status: 1 });

// ─── LostFoundItem ────────────────────────────────────────────────────────────
const lostFoundItemSchema = new mongoose.Schema({
  reporter:    { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  type:        { type: String, enum: ["lost", "found"], required: true },
  itemName:    { type: String, required: true },
  description: { type: String, required: true },
  category:    { type: String, enum: ["electronics", "clothing", "books", "id_card", "keys", "wallet", "other"] },
  location:    { type: String },
  dateLostFound: { type: Date },
  images:      [{ type: String }],
  status:      { type: String, enum: ["open", "claimed", "closed"], default: "open" },
  claimedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  claimedAt:   { type: Date },
  claimVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

// ─── LaundryBooking ───────────────────────────────────────────────────────────
const laundryBookingSchema = new mongoose.Schema({
  student:     { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  bookingDate: { type: Date, required: true },
  timeSlot:    { type: String, required: true },
  machineNumber: { type: Number },
  amount:      { type: Number, default: 0 },
  status:      { type: String, enum: ["booked", "in_progress", "completed", "cancelled"], default: "booked" },
  completedAt: { type: Date },
  notes:       { type: String },
}, { timestamps: true });

laundryBookingSchema.index({ bookingDate: 1, timeSlot: 1, machineNumber: 1 }, { unique: true });

// ─── Inventory ────────────────────────────────────────────────────────────────
const inventorySchema = new mongoose.Schema({
  room:        { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  block:       { type: mongoose.Schema.Types.ObjectId, ref: "Block" },
  itemName:    { type: String, required: true },
  itemCode:    { type: String },
  category:    { type: String, enum: ["furniture", "electronics", "plumbing", "electrical", "other"] },
  quantity:    { type: Number, default: 1 },
  condition:   { type: String, enum: ["good", "fair", "poor", "damaged"], default: "good" },
  repairRequests: [{
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    description: String,
    status:      { type: String, enum: ["pending", "in_progress", "resolved"], default: "pending" },
    requestedAt: { type: Date, default: Date.now },
    resolvedAt:  Date,
  }],
  lastInspected: { type: Date },
  purchaseDate:  { type: Date },
  purchasePrice: { type: Number },
}, { timestamps: true });

// ─── Survey ───────────────────────────────────────────────────────────────────
const surveySchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isAnonymous: { type: Boolean, default: false },
  isActive:    { type: Boolean, default: true },
  startDate:   { type: Date },
  endDate:     { type: Date },
  targetAudience: { type: String, enum: ["all", "boys", "girls", "specific_block"], default: "all" },
  questions: [{
    question:    { type: String, required: true },
    type:        { type: String, enum: ["rating", "multiple_choice", "text", "yes_no"], required: true },
    options:     [{ type: String }],
    isRequired:  { type: Boolean, default: true },
  }],
  responses: [{
    respondent:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    answers:     [{ questionIndex: Number, answer: mongoose.Schema.Types.Mixed }],
    submittedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = {
  Event:          mongoose.model("Event", eventSchema),
  MarketplaceItem: mongoose.model("MarketplaceItem", marketplaceItemSchema),
  LostFoundItem:   mongoose.model("LostFoundItem", lostFoundItemSchema),
  LaundryBooking:  mongoose.model("LaundryBooking", laundryBookingSchema),
  Inventory:       mongoose.model("Inventory", inventorySchema),
  Survey:          mongoose.model("Survey", surveySchema),
};
