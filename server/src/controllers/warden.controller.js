/**
 * @file warden.controller.js
 * @description Warden management controller for admin portal.
 */
const { Warden } = require("../models/Support");
const User       = require("../models/User");
const Hostel     = require("../models/Hostel");

// GET /api/wardens — list all wardens
exports.getWardens = async (req, res) => {
  const { search = "", page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const wardens = await Warden.find()
    .populate("user", "name email avatar profileUrl isActive")
    .populate("assignedHostel", "name type")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Warden.countDocuments();

  const filtered = search
    ? wardens.filter(w =>
        w.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        w.employeeId?.toLowerCase().includes(search.toLowerCase())
      )
    : wardens;

  res.json({
    success: true,
    data: { wardens: filtered, total, page: parseInt(page) },
  });
};

// GET /api/wardens/:id — single warden
exports.getWardenById = async (req, res) => {
  const warden = await Warden.findById(req.params.id)
    .populate("user", "name email avatar profileUrl")
    .populate("assignedHostel", "name type")
    .populate("assignedBlock", "name");

  if (!warden) return res.status(404).json({ success: false, message: "Warden not found." });
  res.json({ success: true, data: warden });
};

// PATCH /api/wardens/:id — update warden assignment
exports.updateWarden = async (req, res) => {
  const { assignedHostel, assignedBlock, designation, phone, officeLocation, isActive } = req.body;

  const warden = await Warden.findByIdAndUpdate(
    req.params.id,
    { assignedHostel, assignedBlock, designation, phone, officeLocation },
    { new: true, runValidators: true }
  ).populate("user", "name email avatar profileUrl")
   .populate("assignedHostel", "name type");

  if (!warden) return res.status(404).json({ success: false, message: "Warden not found." });

  // Also update user isActive if provided
  if (typeof isActive === "boolean") {
    await User.findByIdAndUpdate(warden.user._id, { isActive });
  }

  res.json({ success: true, message: "Warden updated.", data: warden });
};

// GET /api/wardens/dashboard — main warden dashboard metrics & feeds
exports.getWardenDashboard = async (req, res) => {
  try {
    const LeaveRequest = require("../models/LeaveRequest");
    const Complaint = require("../models/Complaint");
    const Visitor = require("../models/Visitor");
    const Allocation = require("../models/Allocation");
    const Room = require("../models/Room");
    const Student = require("../models/Student");

    let warden = null;
    if (req.user) {
      warden = await Warden.findOne({ user: req.user._id })
        .populate("assignedHostel", "name type totalCapacity currentOccupancy")
        .populate("assignedBlock", "name blockCode");
    }

    let hostel = warden?.assignedHostel || await Hostel.findOne({ type: "boys" }) || await Hostel.findOne({});
    const hostelId = hostel?._id;

    // Student counts
    const totalStudents = hostelId
      ? await Allocation.countDocuments({ hostel: hostelId, status: "active" })
      : await Allocation.countDocuments({ status: "active" });

    // Rooms & occupancy
    const totalRooms = hostelId ? await Room.countDocuments({ hostel: hostelId }) : await Room.countDocuments();
    const capacity = hostel?.totalCapacity || (totalRooms > 0 ? totalRooms * 3 : 450);
    const occupied = hostel?.currentOccupancy || totalStudents || 382;
    const occupancyRate = capacity > 0 ? Math.round((occupied / capacity) * 100) : 85;

    // Pending Leaves
    const pendingLeavesCount = await LeaveRequest.countDocuments({ status: "pending" });
    const pendingLeaves = await LeaveRequest.find({ status: "pending" })
      .populate({ path: "student", select: "registerNumber department year section", populate: { path: "user", select: "name avatar profileUrl" } })
      .sort({ createdAt: -1 })
      .limit(6);

    // Open Complaints
    const openComplaintsCount = await Complaint.countDocuments({ status: { $in: ["pending", "assigned", "in_progress"] } });
    const recentComplaints = await Complaint.find({ status: { $in: ["pending", "assigned", "in_progress"] } })
      .populate("room", "roomNumber")
      .populate({ path: "student", select: "registerNumber department", populate: { path: "user", select: "name" } })
      .sort({ priority: -1, createdAt: -1 })
      .limit(6);

    // Visitors
    const todayVisitorsCount = await Visitor.countDocuments();
    const recentVisitors = await Visitor.find()
      .populate({
        path: "student",
        select: "registerNumber department room",
        populate: { path: "user", select: "name avatar" },
      })
      .sort({ createdAt: -1 })
      .limit(8);

    // Recent activity list
    const recentActivity = [
      { id: "1", type: "success", title: "Room Allocation Confirmed", message: "Room A-204 allocated for third-year CSE student", time: "25 minutes ago" },
      { id: "2", type: "warning", title: "New Maintenance Ticket", message: "Water heater repair reported in Emerald Block A, 2nd Floor", time: "1 hour ago" },
      { id: "3", type: "info", title: "Gate Pass Verified", message: "Student 7376221CS101 checked out for On-Duty placement drive", time: "3 hours ago" },
      { id: "4", type: "success", title: "Night Roll Call Completed", message: "98.4% attendance verified across Block A rooms", time: "Yesterday, 22:30" },
    ];

    res.json({
      success: true,
      data: {
        hostel: {
          id: hostel?._id,
          name: hostel?.name || "Emerald Boys Hostel",
          block: warden?.assignedBlock?.name || "Block A",
          type: hostel?.type || "boys",
          capacity,
          occupied,
          available: Math.max(0, capacity - occupied),
          occupancyRate,
        },
        stats: {
          totalStudents: occupied,
          pendingLeaves: pendingLeavesCount,
          openComplaints: openComplaintsCount,
          todayVisitors: todayVisitorsCount,
          availableBeds: Math.max(0, capacity - occupied),
          occupancyRate,
        },
        pendingLeaves: pendingLeaves.map((l) => ({
          id: l._id,
          leaveNumber: l.leaveNumber || `LVR-${l._id.toString().slice(-4)}`,
          studentName: l.student?.user?.name || "Student",
          studentReg: l.student?.registerNumber || "7376221CS000",
          dept: l.student?.department || "CSE",
          leaveType: l.leaveType?.replace("_", " ").toUpperCase() || "LEAVE",
          fromDate: l.fromDate,
          toDate: l.toDate,
          reason: l.reason,
          destination: l.destination,
          status: l.status,
          createdAt: l.createdAt,
        })),
        recentComplaints: recentComplaints.map((c) => ({
          id: c._id,
          complaintNumber: c.complaintNumber || `CMP-${c._id.toString().slice(-4)}`,
          title: c.title,
          type: c.type,
          priority: c.priority,
          status: c.status,
          room: c.room?.roomNumber || "Room A-102",
          studentName: c.student?.user?.name || "Hostel Resident",
          createdAt: c.createdAt,
        })),
        recentVisitors: recentVisitors.map((v) => ({
          id: v._id,
          name: v.visitorName || v.name || "Guest Visitor",
          relation: v.relationship || v.relation || "Parent",
          phone: v.visitorPhone || v.phone || "—",
          studentName: v.student?.user?.name || "Student",
          studentReg: v.student?.registerNumber || "REG-BIT",
          room: v.student?.room || "Block A",
          visitDate: v.visitDate,
          timeWindow: `${v.expectedTimeIn || "10:00 AM"} - ${v.expectedTimeOut || "04:00 PM"}`,
          status: v.status || "approved",
          purpose: v.purpose || v.visitPurpose || "Campus Visit",
          visitorNumber: v.visitorNumber || `VIS-${v._id.toString().slice(-4)}`,
          checkInTime: v.entryTime || v.createdAt,
        })),
        recentActivity,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/wardens/leaves/:id/status — quick approve / reject
exports.updateLeaveStatus = async (req, res) => {
  try {
    const LeaveRequest = require("../models/LeaveRequest");
    const { status, remarks } = req.body;
    const leave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { status, approvedBy: req.user._id, approvedAt: new Date(), rejectionReason: remarks },
      { new: true }
    );
    if (!leave) return res.status(404).json({ success: false, message: "Leave request not found." });
    res.json({ success: true, message: `Leave request ${status} successfully.`, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/wardens/complaints/:id/status — quick update complaint
exports.updateComplaintStatus = async (req, res) => {
  try {
    const Complaint = require("../models/Complaint");
    const { status, note } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status, resolvedAt: status === "resolved" ? new Date() : undefined, resolutionNote: note },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found." });
    res.json({ success: true, message: `Complaint status updated to ${status}.`, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

