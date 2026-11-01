/**
 * @file complaint.routes.js
 * @description Comprehensive complaint API routes for students and staff.
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const Complaint = require("../models/Complaint");
const Student = require("../models/Student");

// GET /api/complaints/my — get current student's complaints
router.get("/my", authenticate, async (req, res) => {
  try {
    let complaints = await Complaint.find({ user: req.user._id })
      .populate("room", "roomNumber")
      .sort({ createdAt: -1 });

    if (!complaints) {
      complaints = [];
    }

    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/complaints — get all complaints (warden / admin)
router.get("/", authenticate, async (req, res) => {
  try {
    const { status, type, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    const complaints = await Complaint.find(filter)
      .populate("room", "roomNumber")
      .populate({ path: "student", select: "registerNumber department", populate: { path: "user", select: "name" } })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/complaints — lodge new complaint
router.post("/", authenticate, async (req, res) => {
  try {
    const { type, priority = "medium", title, description, roomNumber } = req.body;
    const student = await Student.findOne({ user: req.user._id });

    const count = await Complaint.countDocuments();
    const complaintNumber = `CMP-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const newComplaint = await Complaint.create({
      user: req.user._id,
      student: student?._id || req.user._id,
      complaintNumber,
      type: type || "maintenance",
      priority: priority || "medium",
      title,
      description,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Complaint registered successfully. Assigned ticket ID: " + complaintNumber,
      data: newComplaint,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/complaints/:id/status — update status
router.patch("/:id/status", authenticate, async (req, res) => {
  try {
    const { status, resolutionNote } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        status,
        resolutionNote,
        resolvedAt: status === "resolved" ? new Date() : undefined,
      },
      { new: true }
    );
    res.json({ success: true, message: `Status updated to ${status}`, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/complaints/:id/feedback — student feedback
router.patch("/:id/feedback", authenticate, async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { studentRating: rating, studentFeedback: feedback },
      { new: true }
    );
    res.json({ success: true, message: "Feedback submitted successfully.", data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/complaints/:id — student withdraws/cancels a pending complaint
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, user: req.user._id });
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found or not yours." });
    if (!["pending"].includes(complaint.status)) {
      return res.status(400).json({ success: false, message: "Only pending complaints can be withdrawn." });
    }
    await complaint.deleteOne();
    res.json({ success: true, message: "Complaint withdrawn successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
