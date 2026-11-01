/**
 * @file leave.routes.js
 * @description Leave & Outpass API routes for students and wardens.
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const LeaveRequest = require("../models/LeaveRequest");
const Student = require("../models/Student");

// GET /api/leave/my — get current student's leaves
router.get("/my", authenticate, async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ user: req.user._id })
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/leave — list all leaves (warden & admin)
router.get("/", authenticate, async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && status.toLowerCase() !== "all") {
      filter.status = status.toLowerCase();
    }

    let leaves = await LeaveRequest.find(filter)
      .populate({
        path: "student",
        select: "registerNumber department year section phone room block hostel",
        populate: { path: "user", select: "name email avatar profileUrl phone" },
      })
      .populate("user", "name email avatar profileUrl phone")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    if (search) {
      const q = search.toLowerCase();
      leaves = leaves.filter((l) => {
        const studentName = l.student?.user?.name || l.user?.name || "";
        const regNo = l.student?.registerNumber || "";
        const leaveType = l.leaveType || "";
        const reason = l.reason || "";
        const dest = l.destination || "";
        return (
          studentName.toLowerCase().includes(q) ||
          regNo.toLowerCase().includes(q) ||
          leaveType.toLowerCase().includes(q) ||
          reason.toLowerCase().includes(q) ||
          dest.toLowerCase().includes(q)
        );
      });
    }

    // Compute status counts for KPI widgets
    const allCounts = await LeaveRequest.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusCounts = { pending: 0, approved: 0, rejected: 0, total: 0 };
    allCounts.forEach((c) => {
      if (c._id) statusCounts[c._id.toLowerCase()] = c.count;
      statusCounts.total += c.count;
    });

    res.json({
      success: true,
      data: leaves,
      statusCounts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leave — apply for leave (student)
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      leaveType,
      fromDate,
      toDate,
      reason,
      remarks,
      destination,
      emergencyPhone,
      parentConsent,
    } = req.body;

    if (!fromDate || !toDate) {
      return res.status(400).json({ success: false, message: "From date and To date are required." });
    }

    let student = await Student.findOne({ user: req.user._id });
    if (!student) {
      student = await Student.create({
        user: req.user._id,
        registerNumber: req.user.email ? req.user.email.split("@")[0].toUpperCase() : `REG-${Date.now().toString().slice(-4)}`,
        department: "General",
        year: 1,
        gender: "other",
      });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    const daysDiff = Math.max(1, Math.ceil((to - from) / (1000 * 60 * 60 * 24)));

    const newLeave = await LeaveRequest.create({
      user: req.user._id,
      student: student._id,
      leaveType: leaveType || "home_visit",
      fromDate: from,
      toDate: to,
      noOfDays: daysDiff,
      reason: reason || remarks || "Personal Leave",
      destination: destination || "Home / Outstation",
      emergencyPhone: emergencyPhone || student.emergencyContact?.phone || student.parentPhone || "",
      parentConsent: Boolean(parentConsent),
      status: "pending",
    });

    // Populate for response
    const populated = await LeaveRequest.findById(newLeave._id)
      .populate({
        path: "student",
        select: "registerNumber department year section",
        populate: { path: "user", select: "name avatar profileUrl" },
      })
      .populate("user", "name email avatar profileUrl");

    res.status(201).json({
      success: true,
      message: "Leave application submitted successfully for Warden review.",
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/leave/:id/status — update status (warden / admin)
router.patch("/:id/status", authenticate, async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const normStatus = (status || "").toLowerCase();

    const leave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: normStatus,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        rejectionReason: normStatus === "rejected" ? remarks : undefined,
      },
      { new: true }
    )
      .populate({
        path: "student",
        select: "registerNumber department year section",
        populate: { path: "user", select: "name email avatar profileUrl" },
      })
      .populate("user", "name email avatar profileUrl")
      .populate("approvedBy", "name email");

    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave request not found." });
    }

    res.json({
      success: true,
      message: `Leave request ${normStatus} successfully.`,
      data: leave,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/leave/:id — delete or cancel leave
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave request not found." });
    }

    // Only creator student, warden, or admin can delete
    const isOwner = leave.user.toString() === req.user._id.toString();
    const isStaff = ["warden", "admin"].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this leave request." });
    }

    await LeaveRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Leave request deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
