/**
 * @file Payment.js
 * @description Payment and Transaction models for hostel fees.
 */
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  student:    { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  allocation: { type: mongoose.Schema.Types.ObjectId, ref: "Allocation" },

  paymentNumber: { type: String, unique: true },

  paymentType: {
    type: String,
    enum: ["hostel_fee", "security_deposit", "mess_fee", "laundry", "fine", "other"],
    required: true,
  },

  amount:     { type: Number, required: true, min: 0 },
  dueDate:    { type: Date },
  paidAt:     { type: Date },

  academicYear: { type: String },
  month:        { type: String },
  description:  { type: String },

  status: {
    type: String,
    enum: ["pending", "processing", "paid", "failed", "refunded", "cancelled"],
    default: "pending",
  },

  // ── Payment Gateway ───────────────────────────────────────
  gateway:       { type: String, enum: ["razorpay", "offline", "bank_transfer", "upi", "mock"] },
  transactionId: { type: String },
  orderId:       { type: String },
  gatewayResponse: { type: mongoose.Schema.Types.Mixed },

  // ── Receipt ───────────────────────────────────────────────
  receiptUrl:    { type: String },
  receiptNumber: { type: String },

  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  notes:       { type: String },
}, { timestamps: true });

paymentSchema.index({ student: 1, status: 1 });
paymentSchema.index({ dueDate: 1 });
paymentSchema.index({ paymentType: 1 });

paymentSchema.pre("save", async function (next) {
  if (!this.paymentNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Payment").countDocuments();
    this.paymentNumber = `PAY-${year}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
