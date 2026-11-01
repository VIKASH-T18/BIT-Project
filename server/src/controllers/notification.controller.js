/**
 * @file notification.controller.js
 * @description Real-time notification management — fetch, mark read, delete.
 */

const Notification = require("../models/Notification");
const logger = require("../utils/logger");

// ─── Get My Notifications ─────────────────────────────────────────────────────
/**
 * @route   GET /api/notifications
 * @desc    Get paginated notifications for the current user
 * @access  Private
 */
exports.getMyNotifications = async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false, type } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = { recipient: req.user._id, isDeleted: false };
  if (unreadOnly === "true") filter.isRead = false;
  if (type) filter.type = type;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sender", "name avatar profileUrl"),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false, isDeleted: false }),
  ]);

  res.json({
    success: true,
    data: {
      notifications,
      unreadCount,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
};

// ─── Get Unread Count ─────────────────────────────────────────────────────────
/**
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
exports.getUnreadCount = async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
    isDeleted: false,
  });
  res.json({ success: true, data: { unreadCount } });
};

// ─── Mark Single Notification as Read ────────────────────────────────────────
/**
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
exports.markRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification not found." });
  }
  res.json({ success: true, data: notification });
};

// ─── Mark All as Read ─────────────────────────────────────────────────────────
/**
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
exports.markAllRead = async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  res.json({ success: true, message: "All notifications marked as read." });
};

// ─── Delete Notification ──────────────────────────────────────────────────────
/**
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isDeleted: true },
    { new: true }
  );
  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification not found." });
  }
  res.json({ success: true, message: "Notification deleted." });
};

// ─── Create Notification (internal helper, also exposed for admin) ─────────────
/**
 * @route   POST /api/notifications/send (admin/warden)
 * @access  Private (admin/warden)
 */
exports.sendNotification = async (req, res) => {
  const { recipientId, type, title, message, data, priority, actionUrl, actionText } = req.body;

  const notification = await Notification.create({
    recipient: recipientId,
    sender: req.user._id,
    type: type || "system",
    title,
    message,
    data,
    priority: priority || "normal",
    actionUrl,
    actionText,
  });

  logger.info(`Notification sent to ${recipientId}: ${title}`);
  res.status(201).json({ success: true, data: notification });
};

// ─── Helper: Create notification (for use in other controllers) ───────────────
exports.createNotification = async ({
  recipientId, senderId = null, type, title, message,
  data = {}, priority = "normal", actionUrl, actionText,
}) => {
  try {
    return await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      data,
      priority,
      actionUrl,
      actionText,
    });
  } catch (err) {
    logger.warn(`Notification creation failed: ${err.message}`);
  }
};
