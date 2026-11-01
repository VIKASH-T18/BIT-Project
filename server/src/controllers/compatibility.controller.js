/**
 * @file compatibility.controller.js
 * @description AI Roommate Compatibility — profile CRUD + recommendation engine.
 */

const CompatibilityProfile = require("../models/CompatibilityProfile");
const CompatibilityResult  = require("../models/CompatibilityResult");
const Student = require("../models/Student");
const { computeAndSave, getRecommendations, calculateCompatibility } = require("../services/compatibility.service");
const logger = require("../utils/logger");

// ─── Get My Compatibility Profile ─────────────────────────────────────────────
/**
 * @route   GET /api/compatibility/profile
 * @access  Private (student)
 */
exports.getMyProfile = async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    return res.status(404).json({ success: false, message: "Student profile not found." });
  }

  const profile = await CompatibilityProfile.findOne({ student: student._id });
  res.json({ success: true, data: profile || { isComplete: false } });
};

// ─── Create / Update Compatibility Profile ────────────────────────────────────
/**
 * @route   POST /api/compatibility/profile
 * @access  Private (student)
 */
exports.upsertProfile = async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    return res.status(404).json({ success: false, message: "Student profile not found." });
  }

  const updateData = { ...req.body };
  delete updateData._id;
  delete updateData.student;
  delete updateData.isComplete;

  const profile = await CompatibilityProfile.findOneAndUpdate(
    { student: student._id },
    { ...updateData, student: student._id },
    { new: true, upsert: true, runValidators: true }
  );

  logger.info(`Compatibility profile updated for student ${student.registerNumber} | Complete: ${profile.isComplete}`);

  res.json({
    success: true,
    message: profile.isComplete
      ? "Compatibility profile saved! You can now find roommate matches."
      : "Profile partially saved. Complete all required fields to unlock AI matching.",
    data: profile,
  });
};

// ─── Get Roommate Recommendations ─────────────────────────────────────────────
/**
 * @route   GET /api/compatibility/recommendations
 * @access  Private (student)
 */
exports.getRecommendations = async (req, res) => {
  const { limit = 10, department, year } = req.query;

  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    return res.status(404).json({ success: false, message: "Student profile not found." });
  }

  const recommendations = await getRecommendations(
    student._id.toString(),
    parseInt(limit),
    { department, year }
  );

  res.json({ success: true, data: recommendations });
};

// ─── Compute Compatibility Between Two Students ────────────────────────────────
/**
 * @route   POST /api/compatibility/compute
 * @access  Private (student)
 */
exports.computeCompatibility = async (req, res) => {
  const { targetStudentId } = req.body;

  if (!targetStudentId) {
    return res.status(400).json({ success: false, message: "targetStudentId is required." });
  }

  const myStudent = await Student.findOne({ user: req.user._id });
  if (!myStudent) {
    return res.status(404).json({ success: false, message: "Student profile not found." });
  }

  const result = await computeAndSave(myStudent._id.toString(), targetStudentId);
  res.json({ success: true, data: result });
};

// ─── Get Saved Compatibility Result ───────────────────────────────────────────
/**
 * @route   GET /api/compatibility/result/:targetStudentId
 * @access  Private (student)
 */
exports.getCompatibilityResult = async (req, res) => {
  const { targetStudentId } = req.params;

  const myStudent = await Student.findOne({ user: req.user._id });
  if (!myStudent) {
    return res.status(404).json({ success: false, message: "Student profile not found." });
  }

  const [s1, s2] = [myStudent._id.toString(), targetStudentId].sort();
  const result = await CompatibilityResult.findOne({ student1: s1, student2: s2 });

  if (!result) {
    return res.status(404).json({ success: false, message: "No compatibility result found. Run compute first." });
  }

  res.json({ success: true, data: result });
};

// ─── Admin: Get All Profiles ───────────────────────────────────────────────────
/**
 * @route   GET /api/compatibility/all-profiles
 * @access  Private (admin/warden)
 */
exports.getAllProfiles = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [profiles, total] = await Promise.all([
    CompatibilityProfile.find({ isComplete: true })
      .populate({ path: "student", populate: { path: "user", select: "name email" } })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ updatedAt: -1 }),
    CompatibilityProfile.countDocuments({ isComplete: true }),
  ]);

  res.json({
    success: true,
    data: {
      profiles,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    },
  });
};
