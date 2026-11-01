/**
 * @file analytics.routes.js
 * @description Real-time Analytics & Live Monitoring API routes for admin and wardens.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const Student = require("../models/Student");
const Room = require("../models/Room");
const Allocation = require("../models/Allocation");
const Complaint = require("../models/Complaint");
const Visitor = require("../models/Visitor");
const Payment = require("../models/Payment");
const Application = require("../models/Application");

/**
 * GET /api/analytics/live
 * Fetches real-time operational metrics across all hostel collections.
 */
router.get("/live", authenticate, authorize("admin", "warden"), async (req, res) => {
  const [
    totalStudents,
    totalRooms,
    occupiedRooms,
    availableRooms,
    pendingComplaints,
    inProgressComplaints,
    resolvedComplaints,
    todayVisitors,
    recentApplications,
    recentPayments,
  ] = await Promise.all([
    Student.countDocuments(),
    Room.countDocuments(),
    Room.countDocuments({ status: "occupied" }),
    Room.countDocuments({ status: "available" }),
    Complaint.countDocuments({ status: "pending" }),
    Complaint.countDocuments({ status: "in_progress" }),
    Complaint.countDocuments({ status: "resolved" }),
    Visitor.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
    Application.find()
      .populate({ path: "student", populate: { path: "user", select: "name" } })
      .sort({ createdAt: -1 })
      .limit(5),
    Payment.find({ status: "paid" })
      .populate({ path: "student", populate: { path: "user", select: "name" } })
      .sort({ paidAt: -1 })
      .limit(5),
  ]);

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Build live activity stream
  const activityStream = [];
  recentApplications.forEach((app) => {
    activityStream.push({
      id: app._id,
      title: "Hostel Room Application",
      description: `${app.student?.user?.name || "Student"} submitted preference for ${app.roomType || "Standard"} Room`,
      time: app.createdAt,
      type: "application",
    });
  });

  recentPayments.forEach((pay) => {
    activityStream.push({
      id: pay._id,
      title: "Fee Payment Received",
      description: `₹${(pay.amount || 0).toLocaleString("en-IN")} received from ${pay.student?.user?.name || "Student"} (${pay.feeType || "Hostel Fee"})`,
      time: pay.paidAt || pay.createdAt,
      type: "payment",
    });
  });

  activityStream.sort((a, b) => new Date(b.time) - new Date(a.time));

  res.json({
    success: true,
    data: {
      metrics: {
        totalStudents,
        totalRooms,
        occupiedRooms,
        availableRooms,
        occupancyRate,
        pendingComplaints,
        inProgressComplaints,
        resolvedComplaints,
        todayVisitors,
      },
      roomBreakdown: [
        { name: "Occupied", value: occupiedRooms || 0, color: "#3b82f6" },
        { name: "Available", value: availableRooms || 0, color: "#10b981" },
        { name: "Under Maintenance", value: Math.max(0, totalRooms - occupiedRooms - availableRooms), color: "#f59e0b" },
      ],
      complaintsBreakdown: [
        { name: "Pending", value: pendingComplaints || 0, color: "#ef4444" },
        { name: "In Progress", value: inProgressComplaints || 0, color: "#f59e0b" },
        { name: "Resolved", value: resolvedComplaints || 0, color: "#10b981" },
      ],
      activityStream: activityStream.slice(0, 8),
      lastUpdated: new Date().toISOString(),
    },
  });
});

/** GET /api/analytics/overview (Compatibility alias) */
router.get("/overview", authenticate, async (req, res) => {
  const [students, rooms, complaints, visitors] = await Promise.all([
    Student.countDocuments(),
    Room.countDocuments({ status: "occupied" }),
    Complaint.countDocuments({ status: "pending" }),
    Visitor.countDocuments(),
  ]);
  res.json({
    success: true,
    data: {
      totalStudents: students,
      occupiedRooms: rooms,
      pendingComplaints: complaints,
      todayVisitors: visitors,
    },
  });
});

module.exports = router;
