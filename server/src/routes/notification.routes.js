/**
 * @file notification.routes.js
 * @description Notification API routes.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { body } = require("express-validator");
const { validateRequest } = require("../middleware/validate.middleware");
const {
  getMyNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  sendNotification,
} = require("../controllers/notification.controller");

// ─── User Routes ──────────────────────────────────────────────────────────────

/** GET /api/notifications — paginated list */
router.get("/", authenticate, getMyNotifications);

/** GET /api/notifications/unread-count */
router.get("/unread-count", authenticate, getUnreadCount);

/** PATCH /api/notifications/read-all — mark all read */
router.patch("/read-all", authenticate, markAllRead);

/** PATCH /api/notifications/:id/read — mark one read */
router.patch("/:id/read", authenticate, markRead);

/** DELETE /api/notifications/:id */
router.delete("/:id", authenticate, deleteNotification);

// ─── Admin Routes ─────────────────────────────────────────────────────────────

/** POST /api/notifications/send — admin sends notification to a user */
router.post(
  "/send",
  authenticate,
  authorize("admin", "warden"),
  [
    body("recipientId").notEmpty().withMessage("recipientId required"),
    body("title").notEmpty().withMessage("title required"),
    body("message").notEmpty().withMessage("message required"),
  ],
  validateRequest,
  sendNotification
);

module.exports = router;
