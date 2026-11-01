/**
 * @file student.controller.js
 * @description Student profile management and dashboard stats.
 */

const Student = require("../models/Student");
const User = require("../models/User");
const Allocation = require("../models/Allocation");
const Application = require("../models/Application");
const Notification = require("../models/Notification");
const CompatibilityProfile = require("../models/CompatibilityProfile");

// ─── Student Dashboard ────────────────────────────────────────────────────────
/**
 * @route   GET /api/students/dashboard
 * @access  Private (student)
 */
exports.getStudentDashboard = async (req, res) => {
  const student = await Student.findOne({ user: req.user._id })
    .populate("compatibilityProfile")
    .populate({
      path: "currentAllocation",
      populate: [
        { path: "block", select: "name blockCode gender" },
        { path: "room", select: "roomNumber roomType floor capacity occupied" },
      ],
    });

  if (!student) {
    return res.json({
      success: true,
      data: {
        openComplaints: 0,
        feeDue: 0,
        unreadNotifs: 0,
        recentActivity: [],
        hostelStatus: "not_applied",
        currentAllocation: null,
      },
    });
  }

  const unreadNotifs = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
    isDeleted: false,
  });

  const recentNotifs = await Notification.find({ recipient: req.user._id, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("title message type createdAt isRead");

  const recentActivity = recentNotifs.map((n) => ({
    message: n.title,
    detail: n.message,
    time: formatTimeAgo(n.createdAt),
    type:
      n.type === "room_allocated" || n.type === "application_approved" || n.type === "leave_approved"
        ? "success"
        : n.type === "application_rejected" || n.type === "complaint_updated"
        ? "warning"
        : "info",
    isRead: n.isRead,
  }));

  // Fetch latest application
  const y = new Date().getFullYear();
  const currentAcYear = `${y}-${(y + 1).toString().slice(2)}`;
  const latestApp = await Application.findOne({
    student: student._id,
    academicYear: currentAcYear,
  }).select("status priorityScore waitlistPosition submittedAt");

  res.json({
    success: true,
    data: {
      openComplaints: 0, // Placeholder until complaint controller is wired
      feeDue: 0,
      unreadNotifs,
      recentActivity,
      hostelStatus: student.hostelStatus,
      currentAllocation: student.currentAllocation || null,
      profileCompletion: student.profileCompletion,
      compatibilityComplete: student.compatibilityProfile?.isComplete || false,
      latestApplication: latestApp,
    },
  });
};

// ─── Get My Profile ───────────────────────────────────────────────────────────
/**
 * @route   GET /api/students/me
 * @access  Private (student)
 */
exports.getMyProfile = async (req, res) => {
  const student = await Student.findOne({ user: req.user._id })
    .populate("user", "name email avatar profileUrl notificationPreferences")
    .populate("currentAllocation")
    .populate("compatibilityProfile");

  if (!student) {
    return res.status(404).json({ success: false, message: "Student profile not found." });
  }

  res.json({ success: true, data: student });
};

// ─── Update My Profile ────────────────────────────────────────────────────────
/**
 * @route   PUT /api/students/me
 * @access  Private (student)
 */
exports.updateMyProfile = async (req, res) => {
  const allowedFields = [
    "phone", "parentPhone", "nativeState", "nativeCity", "homeAddress",
    "pincode", "distanceFromCollege", "bio", "languages", "hobbies",
    "bloodGroup", "dateOfBirth", "emergencyContact", "parentDetails",
    "hasMedicalCondition", "medicalDetails", "hasDisability", "disabilityDetails",
    "isScholarshipHolder", "scholarshipDetails", "cgpa",
  ];

  const updates = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const student = await Student.findOneAndUpdate(
    { user: req.user._id },
    updates,
    { new: true, runValidators: true }
  ).populate("user", "name email avatar profileUrl");

  if (!student) {
    return res.status(404).json({ success: false, message: "Student profile not found." });
  }

  res.json({ success: true, message: "Profile updated successfully.", data: student });
};

// ─── Get All Students (Admin/Warden) ──────────────────────────────────────────
/**
 * @route   GET /api/students
 * @access  Private (admin, warden)
 */
exports.getAllStudents = async (req, res) => {
  const {
    page = 1, limit = 20, department, year, gender,
    hostelStatus, search, sortBy = "createdAt", sortOrder = "desc",
  } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};
  if (department) filter.department = department;
  if (year) filter.year = parseInt(year);
  if (gender) filter.gender = gender;
  if (hostelStatus) filter.hostelStatus = hostelStatus;

  let students = await Student.find(filter)
    .populate("user", "name email avatar profileUrl isVerified isActive createdAt")
    .populate("currentAllocation")
    .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
    .skip(skip)
    .limit(parseInt(limit));

  if (search) {
    const q = search.toLowerCase();
    students = students.filter(
      (s) =>
        s.user?.name?.toLowerCase().includes(q) ||
        s.registerNumber?.toLowerCase().includes(q) ||
        s.user?.email?.toLowerCase().includes(q)
    );
  }

  const total = await Student.countDocuments(filter);

  const stats = await Student.aggregate([
    { $group: { _id: "$hostelStatus", count: { $sum: 1 } } },
  ]);
  const hostelStatusCounts = {};
  stats.forEach((s) => { hostelStatusCounts[s._id] = s.count; });

  res.json({
    success: true,
    data: {
      students,
      hostelStatusCounts,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    },
  });
};

// ─── Get Single Student (Admin/Warden) ────────────────────────────────────────
/**
 * @route   GET /api/students/:id
 * @access  Private (admin, warden)
 */
exports.getStudentById = async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate("user", "name email avatar profileUrl lastLoginAt createdAt")
    .populate({
      path: "currentAllocation",
      populate: [
        { path: "room", select: "roomNumber floor roomType isAC capacity" },
        { path: "hostel", select: "name type" },
        { path: "block", select: "name blockCode gender" },
      ],
    })
    .populate("compatibilityProfile");

  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found." });
  }

  const applications = await Application.find({ student: student._id })
    .populate("preferredHostel", "name type")
    .populate("preferredBlock", "name blockCode")
    .sort({ submittedAt: -1 })
    .limit(5);

  res.json({ success: true, data: { student, applications } });
};

// ─── Utility: Format time ago ─────────────────────────────────────────────────
function formatTimeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(date).toLocaleDateString("en-IN");
}
