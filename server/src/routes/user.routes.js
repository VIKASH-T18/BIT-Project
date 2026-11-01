/**
 * @file user.routes.js
 * @description User Profile and Account Management API routes.
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const User = require("../models/User");
const Student = require("../models/Student");

/**
 * GET /api/users/profile
 * Get current authenticated user profile including student/warden details.
 */
router.get("/profile", authenticate, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  let studentProfile = null;
  if (user.role === "student") {
    studentProfile = await Student.findOne({ user: user._id })
      .populate("currentRoom")
      .populate("currentBlock")
      .populate("currentHostel");
  }

  res.json({
    success: true,
    data: {
      user,
      student: studentProfile,
    },
  });
});

/**
 * PATCH /api/users/profile
 * Update user basic details (name, phone, emergency contact, profileUrl).
 */
router.patch("/profile", authenticate, async (req, res) => {
  const { name, phone, emergencyContact, profileUrl } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(emergencyContact && { emergencyContact }),
      ...(profileUrl && { profileUrl }),
    },
    { new: true }
  ).select("-password -refreshToken");

  res.json({
    success: true,
    message: "Profile updated successfully.",
    data: updatedUser,
  });
});

module.exports = router;
