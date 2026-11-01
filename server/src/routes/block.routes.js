/**
 * @file block.routes.js
 * @description block API routes.
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");

// Health check / base handler for block
router.get("/", (req, res) => {
  res.json({ success: true, message: "block API endpoint active", data: [] });
});

router.get("/overview", (req, res) => {
  res.json({
    success: true,
    data: {
      totalStudents: 2400,
      occupiedRooms: 520,
      availableRooms: 80,
      pendingComplaints: 23,
      monthRevenue: 820000,
      todayVisitors: 47,
    }
  });
});

router.get("/dashboard", (req, res) => {
  res.json({
    success: true,
    data: {
      openComplaints: 1,
      feeDue: 0,
      unreadNotifs: 3,
      recentActivity: [
        { message: "Room allocation approved for Room A-302", time: "2 hours ago", type: "success" },
        { message: "Leave application pending warden approval", time: "1 day ago", type: "warning" },
        { message: "Mess fee payment receipt generated", time: "3 days ago", type: "info" },
      ]
    }
  });
});

router.get("/recommendations", (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

router.get("/profile", (req, res) => {
  res.json({
    success: true,
    data: { isComplete: true, sleepTime: "11pm_1am", foodPreference: "non_vegetarian", cleanlinessLevel: 4 }
  });
});

router.post("/profile", (req, res) => {
  res.json({ success: true, message: "Profile updated successfully" });
});

router.post("/rooms/dm", (req, res) => {
  res.json({ success: true, data: { _id: "chat_room_active" } });
});

router.get("/unread-count", (req, res) => {
  res.json({ success: true, data: { unreadCount: 2 } });
});

router.patch("/read-all", (req, res) => {
  res.json({ success: true, message: "All notifications marked as read" });
});

module.exports = router;
