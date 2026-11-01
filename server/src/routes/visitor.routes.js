/**
 * @file visitor.routes.js
 * @description Visitor gate pass API routes for students and wardens.
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const Visitor = require("../models/Visitor");
const Student = require("../models/Student");

// GET /api/visitors/my — get current student's visitor requests
router.get("/my", authenticate, async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    const query = {
      $or: [
        { user: req.user._id },
        ...(student ? [{ student: student._id }] : []),
      ],
    };

    const visitors = await Visitor.find(query)
      .populate({
        path: "student",
        select: "registerNumber department room",
        populate: { path: "user", select: "name avatar email" },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: visitors || [] });
  } catch (error) {
    console.error("Error fetching student visitors:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/visitors — list all visitors (warden/admin)
router.get("/", authenticate, async (req, res) => {
  try {
    const visitors = await Visitor.find()
      .populate({
        path: "student",
        select: "registerNumber department room",
        populate: { path: "user", select: "name avatar email phone" },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: visitors || [] });
  } catch (error) {
    console.error("Error fetching all visitors:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/visitors — request visitor pass
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      name,
      visitorName,
      relationship,
      relation,
      phone,
      visitorPhone,
      idProofType,
      idProofNumber,
      visitDate,
      expectedTimeIn,
      expectedTimeOut,
      purpose,
      visitPurpose,
      numberOfVisitors,
    } = req.body;

    const vName = (name || visitorName || "").trim();
    const vPhone = (phone || visitorPhone || "").trim();
    const vPurpose = (purpose || visitPurpose || "Family Visit").trim();
    const rawRelation = relationship || relation || "Parent";

    if (!vName) {
      return res.status(400).json({ success: false, message: "Visitor name is required." });
    }
    if (!vPhone) {
      return res.status(400).json({ success: false, message: "Visitor contact phone is required." });
    }

    // Ensure student profile exists for the user
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

    // Generate unique visitor pass number
    const count = await Visitor.countDocuments();
    const year = new Date().getFullYear();
    const visitorNumber = `VIS-${year}-${String(count + 1).padStart(4, "0")}`;

    // Normalize dates
    const vDate = visitDate ? new Date(visitDate) : new Date();
    const passExpiry = new Date(vDate);
    passExpiry.setHours(20, 0, 0, 0); // Valid until 8:00 PM on visit date

    const newVisitor = await Visitor.create({
      user: req.user._id,
      student: student._id,
      visitorNumber,
      name: vName,
      visitorName: vName,
      phone: vPhone,
      visitorPhone: vPhone,
      relationship: rawRelation,
      relation: rawRelation.toLowerCase(),
      idProofType: idProofType || "Aadhaar",
      idProofNumber: idProofNumber || "",
      visitDate: vDate,
      expectedTimeIn: expectedTimeIn || "10:00 AM",
      expectedTimeOut: expectedTimeOut || "04:00 PM",
      purpose: vPurpose,
      visitPurpose: vPurpose,
      numberOfVisitors: Number(numberOfVisitors) || 1,
      status: "approved",
      qrCode: `BIT-VISITOR-PASS:${visitorNumber}:${student.registerNumber}:${vDate.toISOString().slice(0, 10)}`,
      passExpiry,
    });

    const populated = await Visitor.findById(newVisitor._id).populate({
      path: "student",
      select: "registerNumber department room",
      populate: { path: "user", select: "name avatar" },
    });

    res.status(201).json({
      success: true,
      message: `Visitor pass generated: ${visitorNumber}`,
      data: populated || newVisitor,
    });
  } catch (error) {
    console.error("Error creating visitor pass:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/visitors/:id/status — update status (approve, reject, check-in, check-out)
router.patch("/:id/status", authenticate, async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const lowerStatus = (status || "").toLowerCase();

    const updateFields = {
      status: lowerStatus,
      wardenRemarks: remarks,
      approvedBy: req.user._id,
      approvedAt: new Date(),
    };

    if (lowerStatus === "checked_in") {
      updateFields.entryTime = new Date();
    } else if (lowerStatus === "checked_out") {
      updateFields.exitTime = new Date();
    }

    const visitor = await Visitor.findByIdAndUpdate(req.params.id, updateFields, { new: true })
      .populate({
        path: "student",
        select: "registerNumber department room",
        populate: { path: "user", select: "name" },
      });

    if (!visitor) {
      return res.status(404).json({ success: false, message: "Visitor pass not found." });
    }

    res.json({ success: true, message: `Visitor pass status updated to ${status}.`, data: visitor });
  } catch (error) {
    console.error("Error updating visitor pass status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/visitors/:id — cancel/delete visitor pass
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const visitor = await Visitor.findOneAndDelete({
      _id: req.params.id,
      $or: [{ user: req.user._id }],
    });

    if (!visitor) {
      return res.status(404).json({ success: false, message: "Visitor pass not found or unauthorized." });
    }

    res.json({ success: true, message: "Visitor pass cancelled successfully." });
  } catch (error) {
    console.error("Error deleting visitor pass:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
