/**
 * @file Notification.js
 * @description Real-time notification model.
 */
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  type: {
    type: String,
    required: true,
    enum: [
      "room_allocated", "application_approved", "application_rejected",
      "complaint_updated", "complaint_assigned", "complaint_resolved",
      "fee_due", "fee_paid", "leave_approved", "leave_rejected",
      "visitor_approved", "visitor_rejected", "notice_posted",
      "message_received", "compatibility_match", "room_transfer",
      "sos_alert", "waitlist_promoted", "event_reminder",
      "marketplace_interest", "lost_found_claim", "achievement_earned",
      "system"
    ],
  },

  title:   { type: String, required: true },
  message: { type: String, required: true },
  data:    { type: mongoose.Schema.Types.Mixed }, // Extra payload (roomId, complaintId, etc.)

  isRead:    { type: Boolean, default: false },
  readAt:    { type: Date },
  isDeleted: { type: Boolean, default: false },

  // ── Action Link ───────────────────────────────────────────
  actionUrl:  { type: String },
  actionText: { type: String },

  priority:   { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal" },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });

// Auto-expire read notifications after 30 days
notificationSchema.index({ readAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { isRead: true } });

module.exports = mongoose.model("Notification", notificationSchema);
