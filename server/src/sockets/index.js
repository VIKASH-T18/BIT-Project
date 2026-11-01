/**
 * @file index.js (sockets)
 * @description Socket.IO initialization and event handler orchestration.
 * Handles real-time chat, notifications, and presence tracking.
 */

const { Server } = require("socket.io");
const { verifyAccessToken } = require("../utils/jwt");
const User = require("../models/User");
const { ChatRoom, Message } = require("../models/Chat");
const Notification = require("../models/Notification");
const logger = require("../utils/logger");

// ─── Online Users Map ─────────────────────────────────────────────────────────
// Map: userId → Set of socketIds (multi-tab/device support)
const onlineUsers = new Map();

/**
 * Broadcast online users list to all connected clients.
 * @param {object} io - Socket.IO server instance
 */
const broadcastOnlineUsers = (io) => {
  io.emit("online_users", Array.from(onlineUsers.keys()));
};

// ─── Notification Helper ──────────────────────────────────────────────────────

/**
 * Create and emit a real-time notification.
 * @param {object} io - Socket.IO server
 * @param {string} recipientId - User ID of recipient
 * @param {object} notifData - Notification data
 */
const emitNotification = async (io, recipientId, notifData) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      ...notifData,
    });

    const sockets = onlineUsers.get(recipientId.toString());
    if (sockets) {
      sockets.forEach((socketId) => {
        io.to(socketId).emit("notification", notification);
      });
    }
    return notification;
  } catch (err) {
    logger.warn(`Notification emit failed: ${err.message}`);
  }
};

// ─── Initialize Socket.IO ─────────────────────────────────────────────────────

/**
 * Initialize Socket.IO server with authentication and event handlers.
 * @param {object} httpServer - Node.js HTTP server
 */
const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // ── JWT Authentication Middleware ───────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user || !user.isActive) {
        return next(new Error("User not found or inactive"));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  // ── Connection Handler ──────────────────────────────────
  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    logger.info(`Socket connected: ${socket.user.name} (${socket.id})`);

    // ── Track Online Users ────────────────────────────────
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    broadcastOnlineUsers(io);

    // ── Join personal room for targeted events ────────────
    socket.join(`user:${userId}`);

    // ── Join Chat Rooms ───────────────────────────────────
    socket.on("join_chat_rooms", async () => {
      try {
        const chatRooms = await ChatRoom.find({
          "participants.user": socket.user._id,
          isActive: true,
        }).select("_id");

        chatRooms.forEach((room) => {
          socket.join(`chat:${room._id}`);
        });

        socket.emit("chat_rooms_joined", { count: chatRooms.length });
      } catch (err) {
        socket.emit("error", { message: "Failed to join chat rooms" });
      }
    });

    // ── Send Message ──────────────────────────────────────
    socket.on("send_message", async (data) => {
      try {
        const { chatRoomId, content, type = "text", mediaUrl, mediaName, replyTo } = data;

        // Verify user is participant
        const chatRoom = await ChatRoom.findById(chatRoomId);
        if (!chatRoom) return socket.emit("error", { message: "Chat room not found" });

        let isParticipant = chatRoom.participants.some(
          (p) => p.user && p.user.toString() === userId
        );
        if (!isParticipant && (chatRoom.type === "group" || chatRoom.type === "room_group")) {
          chatRoom.participants.push({ user: socket.user._id, role: "member" });
          await chatRoom.save();
          socket.join(`chat:${chatRoomId}`);
          isParticipant = true;
        }
        if (!isParticipant) return socket.emit("error", { message: "Not a participant in this conversation." });

        // Create message
        const message = await Message.create({
          chatRoom:  chatRoomId,
          sender:    socket.user._id,
          type,
          content,
          mediaUrl,
          mediaName,
          replyTo,
          deliveredTo: [socket.user._id],
        });

        // Update chat room last message
        await ChatRoom.findByIdAndUpdate(chatRoomId, {
          lastMessage:   message._id,
          lastMessageAt: new Date(),
        });

        // Populate and broadcast to room
        const populated = await message.populate("sender", "name avatar profileUrl role");

        io.to(`chat:${chatRoomId}`).emit("new_message", populated);

        // Notify offline participants
        for (const participant of chatRoom.participants) {
          const participantId = participant.user.toString();
          if (participantId === userId) continue;

          // Update delivered status
          await Message.findByIdAndUpdate(message._id, {
            $addToSet: { deliveredTo: participant.user },
          });

          // Emit notification
          await emitNotification(io, participant.user, {
            sender:  socket.user._id,
            type:    "message_received",
            title:   `New message from ${socket.user.name}`,
            message: type === "text" ? content?.slice(0, 100) : `Sent a ${type}`,
            data:    { chatRoomId, messageId: message._id },
            actionUrl: `/chat/${chatRoomId}`,
          });
        }
      } catch (err) {
        logger.error(`Send message error: ${err.message}`);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ── Typing Indicator ──────────────────────────────────
    socket.on("typing_start", ({ chatRoomId }) => {
      socket.to(`chat:${chatRoomId}`).emit("typing", {
        userId, userName: socket.user.name, chatRoomId,
      });
    });

    socket.on("typing_stop", ({ chatRoomId }) => {
      socket.to(`chat:${chatRoomId}`).emit("stopped_typing", { userId, chatRoomId });
    });

    // ── Mark Messages as Seen ─────────────────────────────
    socket.on("mark_seen", async ({ chatRoomId, messageIds }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds }, chatRoom: chatRoomId },
          { $addToSet: { seenBy: { user: socket.user._id, seenAt: new Date() } } }
        );

        socket.to(`chat:${chatRoomId}`).emit("messages_seen", {
          userId, chatRoomId, messageIds,
        });
      } catch (err) {
        logger.error(`Mark seen error: ${err.message}`);
      }
    });

    // ── Add Reaction ──────────────────────────────────────
    socket.on("add_reaction", async ({ messageId, emoji }) => {
      try {
        const message = await Message.findByIdAndUpdate(
          messageId,
          {
            $pull:  { reactions: { user: socket.user._id } },
          },
          { new: true }
        );

        if (emoji) {
          await Message.findByIdAndUpdate(messageId, {
            $push: { reactions: { user: socket.user._id, emoji } },
          });
        }

        const updated = await Message.findById(messageId);
        io.to(`chat:${updated.chatRoom}`).emit("reaction_updated", {
          messageId, reactions: updated.reactions,
        });
      } catch (err) {
        logger.error(`Add reaction error: ${err.message}`);
      }
    });

    // ── Delete Message ────────────────────────────────────
    socket.on("delete_message", async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        message.isDeleted = true;
        await message.save();

        io.to(`chat:${message.chatRoom}`).emit("message_deleted", {
          messageId: message._id,
          chatRoomId: message.chatRoom,
        });
      } catch (err) {
        logger.error(`Delete message socket error: ${err.message}`);
      }
    });

    // ── Emergency SOS ─────────────────────────────────────
    socket.on("sos_alert", async (data) => {
      try {
        const { message: sosMessage, location } = data;

        // Broadcast SOS to all wardens/admins
        io.emit("sos_received", {
          from:     { id: userId, name: socket.user.name },
          message:  sosMessage || "EMERGENCY! Please help immediately!",
          location,
          timestamp: new Date(),
        });

        logger.warn(`⚠️ SOS ALERT from ${socket.user.name} (${userId})`);
        socket.emit("sos_sent", { message: "SOS sent to wardens and admin." });
      } catch (err) {
        socket.emit("error", { message: "Failed to send SOS" });
      }
    });

    // ── Disconnect ────────────────────────────────────────
    socket.on("disconnect", () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
        }
      }
      broadcastOnlineUsers(io);
      logger.info(`Socket disconnected: ${socket.user.name} (${socket.id})`);
    });
  });

  // ─── Attach emitNotification to global scope ──────────────────────────────
  global.emitNotification = (recipientId, notifData) =>
    emitNotification(io, recipientId, notifData);

  global.io = io;

  logger.info("✅ Socket.IO initialized");

  return io;
};

module.exports = { initializeSocket, onlineUsers };
