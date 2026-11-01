/**
 * @file admin.controller.js
 * @description Admin overview stats and system-level management.
 */

const User = require("../models/User");
const Student = require("../models/Student");
const Allocation = require("../models/Allocation");
const Application = require("../models/Application");
const Room = require("../models/Room");
const Hostel = require("../models/Hostel");
const Notification = require("../models/Notification");

// ─── Admin Overview Dashboard ─────────────────────────────────────────────────
/**
 * @route   GET /api/admins/overview
 * @access  Private (admin, warden)
 */
exports.getOverview = async (req, res) => {
  const [
    totalStudents,
    allocatedStudents,
    pendingApplications,
    approvedApplications,
    waitlistedApplications,
    totalRooms,
    occupiedRooms,
    availableRooms,
    maintenanceRooms,
    totalUsers,
  ] = await Promise.all([
    Student.countDocuments(),
    Allocation.countDocuments({ status: "active" }),
    Application.countDocuments({ status: "pending" }),
    Application.countDocuments({ status: "approved" }),
    Application.countDocuments({ status: "waitlisted" }),
    Room.countDocuments(),
    Room.countDocuments({ status: { $in: ["partially_occupied", "fully_occupied"] } }),
    Room.countDocuments({ status: "available" }),
    Room.countDocuments({ status: "maintenance" }),
    User.countDocuments({ isActive: true }),
  ]);

  // Allocation trend (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const allocationTrend = await Allocation.aggregate([
    { $match: { status: "active", allocationDate: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$allocationDate" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Department distribution of hostel students
  const deptDistribution = await Student.aggregate([
    { $match: { hostelStatus: "allocated" } },
    { $group: { _id: "$department", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
  ]);

  // Recent activity
  const recentAllocations = await Allocation.find({ status: "active" })
    .populate({ path: "student", populate: { path: "user", select: "name email" } })
    .populate("room", "roomNumber")
    .populate("block", "name")
    .sort({ allocationDate: -1 })
    .limit(8);

  const occupancyRate = totalRooms > 0
    ? Math.round((occupiedRooms / totalRooms) * 100)
    : 0;

  const byBlock = await Room.aggregate([
    {
      $group: {
        _id: "$block",
        totalCapacity: { $sum: "$capacity" },
        totalOccupied: { $sum: "$currentOccupancy" },
      },
    },
    {
      $lookup: {
        from: "blocks",
        localField: "_id",
        foreignField: "_id",
        as: "blockInfo",
      },
    },
    { $unwind: { path: "$blockInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        "blockInfo.name": { $ifNull: ["$blockInfo.blockName", "$blockInfo.blockCode"] },
        "blockInfo.blockCode": 1,
        totalCapacity: 1,
        totalOccupied: 1,
      },
    },
  ]);

  const hostels = await Hostel.find().select("name type");

  res.json({
    success: true,
    data: {
      // Key metrics
      totalStudents,
      allocatedStudents,
      unallocatedStudents: totalStudents - allocatedStudents,
      pendingApplications,
      approvedApplications,
      waitlistedApplications,
      totalApplications: pendingApplications + approvedApplications + waitlistedApplications,
      // Room stats
      totalRooms,
      occupiedRooms,
      availableRooms,
      maintenanceRooms,
      occupancyRate,
      // Users
      totalUsers,
      // Charts
      allocationTrend,
      deptDistribution,
      byBlock,
      // Recent
      recentAllocations,
      hostels,
    },
  });
};

// ─── Admin Stats for Warden too ────────────────────────────────────────────────
/**
 * @route   GET /api/admins/students/stats
 * @access  Private (admin, warden)
 */
exports.getStudentStats = async (req, res) => {
  const stats = await Student.aggregate([
    {
      $facet: {
        byDepartment: [
          { $group: { _id: "$department", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byYear: [
          { $group: { _id: "$year", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
        byGender: [
          { $group: { _id: "$gender", count: { $sum: 1 } } },
        ],
        byHostelStatus: [
          { $group: { _id: "$hostelStatus", count: { $sum: 1 } } },
        ],
      },
    },
  ]);

  res.json({ success: true, data: stats[0] });
};
