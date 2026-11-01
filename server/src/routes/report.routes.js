/**
 * @file report.routes.js
 * @description Reports & analytics export API routes.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const Student    = require("../models/Student");
const Allocation = require("../models/Allocation");
const Payment    = require("../models/Payment");
const Application = require("../models/Application");
const Room       = require("../models/Room");

/** GET /api/reports/summary — full system summary for reports page */
router.get("/summary", authenticate, authorize("admin", "warden"), async (req, res) => {
  const [
    studentCount, allocationCount, pendingApps,
    roomCount, availableRooms, totalRevenue,
    deptBreakdown, genderBreakdown, statusBreakdown, monthlyRevenue,
  ] = await Promise.all([
    Student.countDocuments(),
    Allocation.countDocuments({ status: "active" }),
    Application.countDocuments({ status: "pending" }),
    Room.countDocuments(),
    Room.countDocuments({ status: "available" }),
    Payment.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Student.aggregate([{ $group: { _id: "$department", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
    Student.aggregate([{ $group: { _id: "$gender", count: { $sum: 1 } } }]),
    Student.aggregate([{ $group: { _id: "$hostelStatus", count: { $sum: 1 } } }]),
    Payment.aggregate([
      { $match: { status: "paid", paidAt: { $exists: true } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$paidAt" } }, total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } }, { $limit: 12 },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      kpis: {
        totalStudents: studentCount,
        allocatedStudents: allocationCount,
        occupancyRate: roomCount > 0 ? Math.round((allocationCount / roomCount) * 100) : 0,
        pendingApplications: pendingApps,
        availableRooms,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
      charts: { deptBreakdown, genderBreakdown, statusBreakdown, monthlyRevenue },
    },
  });
});

router.get("/", (req, res) => res.json({ success: true, message: "reports API active" }));

module.exports = router;
