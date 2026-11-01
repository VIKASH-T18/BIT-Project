/**
 * @file ChatRoom.js + Message.js
 * @description Real-time chat models for Socket.IO integration.
 */
const mongoose = require("mongoose");

// ─── Chat Room ────────────────────────────────────────────────────────────────
const chatRoomSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["dm", "group", "room_group"],
    default: "dm",
  },
  name:        { type: String },         // For group chats
  description: { type: String },
  avatar:      { type: String },

  participants: [{
    user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role:     { type: String, enum: ["admin", "member"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
    lastSeen: { type: Date },
    isMuted:  { type: Boolean, default: false },
  }],

  lastMessage:   { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  lastMessageAt: { type: Date },

  hostelRoom:  { type: mongoose.Schema.Types.ObjectId, ref: "Room" }, // For room-based groups
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

chatRoomSchema.index({ "participants.user": 1 });
chatRoomSchema.index({ lastMessageAt: -1 });

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

// ─── Message ──────────────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom", required: true },
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  type: {
    type: String,
    enum: ["text", "image", "pdf", "system", "emoji"],
    default: "text",
  },
  content:  { type: String },    // Text content
  mediaUrl: { type: String },    // Cloudinary URL for image/pdf
  mediaName: { type: String },   // Original filename

  // ── Status ────────────────────────────────────────────────
  deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  seenBy: [{
    user:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    seenAt: { type: Date, default: Date.now },
  }],

  // ── Reply ─────────────────────────────────────────────────
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },

  // ── Reactions ─────────────────────────────────────────────
  reactions: [{
    user:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    emoji: { type: String },
  }],

  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date },
  editedAt:   { type: Date },
}, { timestamps: true });

messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

const Message = mongoose.model("Message", messageSchema);

module.exports = { ChatRoom, Message };
