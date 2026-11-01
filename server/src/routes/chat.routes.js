/**
 * @file chat.routes.js
 * @description Real-time Chat & Direct Messaging API routes.
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const { ChatRoom, Message } = require("../models/Chat");
const User = require("../models/User");

/**
 * GET /api/chat/rooms
 * Fetch all chat channels and conversations for the current user.
 */
router.get("/rooms", authenticate, async (req, res) => {
  const userId = req.user._id;

  // Auto-join user to all public/group channels so everyone sees the community chats
  const publicGroups = await ChatRoom.find({
    type: { $in: ["group", "room_group"] },
    isActive: true,
  });

  for (const gr of publicGroups) {
    const isParticipant = gr.participants.some(
      (p) => p.user && p.user.toString() === userId.toString()
    );
    if (!isParticipant) {
      gr.participants.push({ user: userId, role: "member" });
      await gr.save();
    }
  }

  // If no rooms exist at all, ensure at least "Hostel Community Lounge" exists
  const existingCount = await ChatRoom.countDocuments({ isActive: true });
  if (existingCount === 0) {
    await ChatRoom.create({
      type: "group",
      name: "Hostel Community Lounge",
      description: "Official open lounge for all residents and hostel administration.",
      participants: [{ user: userId, role: "admin" }],
    });
  }

  const rooms = await ChatRoom.find({
    "participants.user": userId,
    isActive: true,
  })
    .populate("participants.user", "name role avatar profileUrl email")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "name role avatar profileUrl" },
    })
    .sort({ lastMessageAt: -1, updatedAt: -1 });

  res.json({
    success: true,
    data: rooms,
  });
});

/**
 * GET /api/chat/rooms/:roomId/messages
 * Fetch messages for a specific chat room.
 */
router.get("/rooms/:roomId/messages", authenticate, async (req, res) => {
  const messages = await Message.find({
    chatRoom: req.params.roomId,
    isDeleted: false,
  })
    .populate("sender", "name role avatar profileUrl")
    .sort({ createdAt: 1 })
    .limit(150);

  res.json({
    success: true,
    data: messages,
  });
});

/**
 * POST /api/chat/rooms/:roomId/messages
 * Send a message to a chat room.
 */
router.post("/rooms/:roomId/messages", authenticate, async (req, res) => {
  const { content, type = "text" } = req.body;
  const { roomId } = req.params;

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: "Message content cannot be empty." });
  }

  const chatRoom = await ChatRoom.findById(roomId);
  if (!chatRoom) {
    return res.status(404).json({ success: false, message: "Chat room not found." });
  }

  // Ensure sender is in room participants
  const isParticipant = chatRoom.participants.some(
    (p) => p.user && p.user.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    chatRoom.participants.push({ user: req.user._id, role: "member" });
  }

  const message = await Message.create({
    chatRoom: roomId,
    sender: req.user._id,
    type,
    content: content.trim(),
    deliveredTo: [req.user._id],
  });

  chatRoom.lastMessage = message._id;
  chatRoom.lastMessageAt = new Date();
  await chatRoom.save();

  const populated = await Message.findById(message._id).populate("sender", "name role avatar profileUrl");

  // Broadcast real-time Socket.IO event to room
  if (global.io) {
    global.io.to(`chat:${roomId}`).emit("new_message", populated);

    // Notify other participants who aren't currently active
    for (const participant of chatRoom.participants) {
      const pId = participant.user?.toString();
      if (pId && pId !== req.user._id.toString()) {
        if (typeof global.emitNotification === "function") {
          global.emitNotification(pId, {
            sender: req.user._id,
            type: "message_received",
            title: `New message from ${req.user.name}`,
            message: content.trim().slice(0, 100),
            data: { chatRoomId: roomId, messageId: message._id },
            actionUrl: `/chat`,
          });
        }
      }
    }
  }

  res.status(201).json({
    success: true,
    data: populated,
  });
});

/**
 * DELETE /api/chat/messages/:messageId
 * Delete a message (by sender or admin/warden).
 */
router.delete("/messages/:messageId", authenticate, async (req, res) => {
  const { messageId } = req.params;
  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({ success: false, message: "Message not found." });
  }

  // Soft delete message (allowed for all accounts: students, wardens, admins)
  message.isDeleted = true;
  await message.save();

  // Update lastMessage on ChatRoom if needed
  const chatRoom = await ChatRoom.findById(message.chatRoom);
  if (chatRoom && chatRoom.lastMessage?.toString() === message._id.toString()) {
    const prevMsg = await Message.findOne({
      chatRoom: message.chatRoom,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    chatRoom.lastMessage = prevMsg ? prevMsg._id : null;
    chatRoom.lastMessageAt = prevMsg ? prevMsg.createdAt : chatRoom.createdAt;
    await chatRoom.save();
  }

  // Broadcast deletion to room
  if (global.io) {
    global.io.to(`chat:${message.chatRoom}`).emit("message_deleted", {
      messageId: message._id,
      chatRoomId: message.chatRoom,
    });
  }

  res.json({
    success: true,
    message: "Message deleted successfully.",
    data: { messageId: message._id, chatRoomId: message.chatRoom },
  });
});

/**
 * POST /api/chat/rooms
 * Create or get direct message conversation with another user.
 */
router.post("/rooms", authenticate, async (req, res) => {
  const { recipientId, name, type = "dm" } = req.body;
  const currentUserId = req.user._id;

  if (type === "dm" && recipientId) {
    // Check if DM exists
    let existing = await ChatRoom.findOne({
      type: "dm",
      $and: [
        { "participants.user": currentUserId },
        { "participants.user": recipientId },
      ],
    })
      .populate("participants.user", "name role avatar profileUrl email")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name role avatar profileUrl" },
      });

    if (existing) {
      return res.json({ success: true, data: existing });
    }

    const room = await ChatRoom.create({
      type: "dm",
      participants: [
        { user: currentUserId, role: "member" },
        { user: recipientId, role: "member" },
      ],
    });

    const populated = await ChatRoom.findById(room._id)
      .populate("participants.user", "name role avatar profileUrl email");

    return res.status(201).json({ success: true, data: populated });
  }

  // Create group chat
  const newRoom = await ChatRoom.create({
    type: "group",
    name: name || "New Group",
    participants: [{ user: currentUserId, role: "admin" }],
  });

  const populated = await ChatRoom.findById(newRoom._id)
    .populate("participants.user", "name role avatar profileUrl email");

  res.status(201).json({ success: true, data: populated });
});

/**
 * GET /api/chat/users
 * Find users to start a chat with:
 *   - Wardens and Admins: show all active accounts
 *   - Students: show only accounts that have actually logged in
 */
router.get("/users", authenticate, async (req, res) => {
  const users = await User.find({
    _id: { $ne: req.user._id },
    isActive: true,
    $or: [
      { role: { $in: ["admin", "warden"] } },
      {
        role: "student",
        $or: [
          { loginCount: { $gt: 0 } },
          { lastLoginAt: { $exists: true, $ne: null } },
        ],
      },
    ],
  })
    .select("name email role avatar profileUrl loginCount lastLoginAt")
    .sort({ role: 1, name: 1 })
    .limit(60);

  res.json({ success: true, data: users });
});

module.exports = router;
