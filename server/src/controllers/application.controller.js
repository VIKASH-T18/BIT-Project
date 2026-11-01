/**
 * @file application.controller.js
 * @description Hostel application lifecycle — submit, review, approve, reject.
 * Triggers email notifications on status changes.
 */

const mongoose = require("mongoose");
const Application = require("../models/Application");
const Student = require("../models/Student");
const Notification = require("../models/Notification");
const Allocation = require("../models/Allocation");
const Room = require("../models/Room");
const Hostel = require("../models/Hostel");
const Block = require("../models/Block");
const {
  sendApplicationStatusEmail,
} = require("../config/nodemailer");
const { calculatePriorityScore, findBestRoom, assignRoom } = require("../services/allocation.service");
const logger = require("../utils/logger");

// ─── Helper: Create In-App Notification ──────────────────────────────────────
const notify = async (recipientId, senderId, type, title, message, data = {}, actionUrl) => {
  try {
    await Notification.create({ recipient: recipientId, sender: senderId, type, title, message, data, actionUrl });
  } catch (err) {
    logger.warn(`Notification failed: ${err.message}`);
  }
};

// ─── Submit Application ───────────────────────────────────────────────────────
/**
 * @route   POST /api/applications
 * @desc    Student submits a hostel application
 * @access  Private (student, admin, warden)
 */
exports.submitApplication = async (req, res) => {
  // Ensure student profile exists — never convert admin/warden into a student
  let student = null;
  if (req.user.role === "student") {
    student = await Student.findOne({ user: req.user._id });
    if (!student) {
      const regNo = req.user.email ? req.user.email.split("@")[0].toUpperCase() : `REG-${Date.now().toString().slice(-4)}`;
      student = await Student.create({
        user: req.user._id,
        registerNumber: regNo,
        department: "CSE",
        year: 1,
        gender: "male",
        hostelStatus: "pending",
      });
      logger.info(`Auto-created Student profile for user ${req.user.email || req.user._id}`);
    }
  } else {
    // If an admin or warden is testing or applying on behalf of a student:
    if (req.body.studentId && mongoose.isValidObjectId(req.body.studentId)) {
      student = await Student.findById(req.body.studentId);
    } else if (req.body.studentRegNo) {
      student = await Student.findOne({ registerNumber: req.body.studentRegNo.trim().toUpperCase() });
    }
    // Fallback to active demo student (Vikash) so staff accounts are never treated as student applicants
    if (!student) {
      student = (await Student.findOne({ registerNumber: "231EC322" })) || (await Student.findOne({ user: { $exists: true } }));
    }
  }

  if (!student) {
    return res.status(400).json({ success: false, message: "Valid student account required to submit an application." });
  }

  const applicantUserId = student.user || req.user._id;

  const academicYear = req.body.academicYear || (() => {
    const y = new Date().getFullYear();
    return `${y}-${(y + 1).toString().slice(2)}`;
  })();

  // 1. Resolve preferredHostel
  let preferredHostel = undefined;
  if (req.body.preferredHostel && mongoose.isValidObjectId(req.body.preferredHostel)) {
    preferredHostel = req.body.preferredHostel;
  } else {
    const targetType = student.gender === "female" ? "girls" : "boys";
    const foundH = (await Hostel.findOne({ type: targetType, isActive: true })) || (await Hostel.findOne({ isActive: true }));
    if (foundH) preferredHostel = foundH._id;
  }

  // 2. Resolve preferredBlock
  let preferredBlock = undefined;
  if (req.body.preferredBlock && mongoose.isValidObjectId(req.body.preferredBlock)) {
    preferredBlock = req.body.preferredBlock;
  } else {
    const rawBlock = req.body.preferredBlockCode || req.body.preferredBlock;
    if (typeof rawBlock === "string" && rawBlock.trim()) {
      const code = rawBlock.trim().toUpperCase();
      const blk = (await Block.findOne({
        ...(preferredHostel ? { hostel: preferredHostel } : {}),
        $or: [
          { blockCode: code },
          { blockName: code },
          { blockCode: `BLK-${code}` },
          { blockName: new RegExp(`Block ${code}`, "i") },
        ],
      })) || (await Block.findOne({
        $or: [
          { blockCode: code },
          { blockName: code },
          { blockCode: `BLK-${code}` },
          { blockName: new RegExp(`Block ${code}`, "i") },
        ],
      }));
      if (blk) preferredBlock = blk._id;
    }
  }

  // 3. Resolve preferredRoommate
  let preferredRoommate = undefined;
  if (req.body.preferredRoommate && mongoose.isValidObjectId(req.body.preferredRoommate)) {
    preferredRoommate = req.body.preferredRoommate;
  } else if (req.body.preferredRoommateRegNo || (typeof req.body.preferredRoommate === "string" && req.body.preferredRoommate.trim())) {
    const regNo = (req.body.preferredRoommateRegNo || req.body.preferredRoommate).trim().toUpperCase();
    const rm = await Student.findOne({ registerNumber: regNo });
    if (rm) preferredRoommate = rm._id;
  }

  // 4. Resolve preferredFloor
  let preferredFloor = undefined;
  if (req.body.preferredFloor !== undefined && req.body.preferredFloor !== null && req.body.preferredFloor !== "") {
    const fl = parseInt(req.body.preferredFloor, 10);
    if (!isNaN(fl)) preferredFloor = fl;
  }

  // 5. Resolve preferredRoomType
  const allowedRoomTypes = ["single", "double", "triple", "four_sharing"];
  const preferredRoomType = allowedRoomTypes.includes(req.body.preferredRoomType) ? req.body.preferredRoomType : "double";

  // Check for existing active application this year by student OR by applicant user
  const existing = await Application.findOne({
    $or: [
      { student: student._id, academicYear },
      { user: applicantUserId, academicYear },
    ],
  });

  let application;
  let finalScore = 0;
  try {
    finalScore = calculatePriorityScore(
      existing || { priorityReasons: req.body.priorityReasons },
      student
    );
  } catch (scoreErr) {
    logger.warn(`Priority score error: ${scoreErr.message}`);
    finalScore = 50;
  }

  const resolvedBlockCode = req.body.preferredBlockCode || (typeof req.body.preferredBlock === "string" && !mongoose.isValidObjectId(req.body.preferredBlock) ? req.body.preferredBlock : undefined);
  const resolvedRoommateRegNo = req.body.preferredRoommateRegNo || (typeof req.body.preferredRoommate === "string" && !mongoose.isValidObjectId(req.body.preferredRoommate) ? req.body.preferredRoommate : undefined);

  if (existing) {
    existing.student = student._id;
    existing.user = applicantUserId;
    existing.preferredHostel = preferredHostel;
    existing.preferredBlock = preferredBlock;
    existing.preferredBlockCode = resolvedBlockCode;
    existing.preferredRoomType = preferredRoomType;
    existing.preferredAC = req.body.preferredAC === true || req.body.preferredAC === "true";
    existing.preferredFloor = preferredFloor;
    existing.preferredRoommate = preferredRoommate;
    existing.preferredRoommateRegNo = resolvedRoommateRegNo;
    existing.useAiMatching = req.body.useAiMatching !== false;
    existing.priorityReasons = req.body.priorityReasons || {};
    existing.documents = req.body.documents || [];
    existing.status = "pending";
    existing.submittedAt = new Date();
    existing.reviewComments = undefined;
    existing.rejectionReason = undefined;
    existing.reviewedBy = undefined;
    existing.reviewedAt = undefined;
    existing.priorityScore = finalScore;
    await existing.save();
    application = existing;
  } else {
    application = await Application.create({
      student:            student._id,
      user:               applicantUserId,
      academicYear,
      preferredHostel,
      preferredBlock,
      preferredBlockCode: resolvedBlockCode,
      preferredRoomType,
      preferredAC:        req.body.preferredAC === true || req.body.preferredAC === "true",
      preferredFloor,
      preferredRoommate,
      preferredRoommateRegNo: resolvedRoommateRegNo,
      useAiMatching:      req.body.useAiMatching !== false,
      priorityReasons:    req.body.priorityReasons || {},
      documents:          req.body.documents || [],
      status:             "pending",
      submittedAt:        new Date(),
      priorityScore:      finalScore,
    });
  }

  // Update student hostel status
  await Student.findByIdAndUpdate(student._id, { hostelStatus: "pending" });

  logger.info(`Application submitted/updated: Student ${student.registerNumber} | Year ${academicYear} | Priority: ${finalScore}`);

  res.status(201).json({
    success: true,
    message: existing
      ? "Application successfully updated with your new hostel preferences!"
      : "Application submitted successfully! You will be notified of the status.",
    data: application,
  });
};

// ─── Get My Application ───────────────────────────────────────────────────────
/**
 * @route   GET /api/applications/my
 * @access  Private (student, admin, warden)
 */
exports.getMyApplication = async (req, res) => {
  let student = null;
  if (req.user.role === "student") {
    student = await Student.findOne({ user: req.user._id });
    if (!student) {
      const regNo = req.user.email ? req.user.email.split("@")[0].toUpperCase() : `REG-${Date.now().toString().slice(-4)}`;
      student = await Student.create({
        user: req.user._id,
        registerNumber: regNo,
        department: "CSE",
        year: 1,
        gender: "male",
      });
    }
  } else {
    // If admin or warden is viewing demo/student view:
    student = (await Student.findOne({ registerNumber: "231EC322" })) || (await Student.findOne({ user: { $exists: true } }));
  }

  if (!student) {
    return res.json({ success: true, data: [] });
  }

  const { academicYear } = req.query;
  const filter = {
    $or: [{ student: student._id }, { user: student.user || req.user._id }],
  };
  if (academicYear) filter.academicYear = academicYear;

  const applications = await Application.find(filter)
    .populate("preferredHostel", "name type")
    .populate("preferredBlock", "blockName blockCode")
    .populate("preferredRoommate", "registerNumber department year")
    .populate("reviewedBy", "name email role")
    .sort({ submittedAt: -1 });

  res.json({ success: true, data: applications });
};

// ─── Get All Applications (Admin/Warden) ─────────────────────────────────────
/**
 * @route   GET /api/applications
 * @access  Private (admin, warden)
 */
exports.getAllApplications = async (req, res) => {
  const {
    page = 1, limit = 200, status, academicYear, department, year, search,
  } = req.query;
  const parsedLimit = parseInt(limit) || 200;
  const skip = (parseInt(page) - 1) * parsedLimit;

  const filter = {};
  if (status) filter.status = status;
  if (academicYear) filter.academicYear = academicYear;

  let applications = await Application.find(filter)
    .populate({
      path: "student",
      match: {
        ...(department && { department }),
        ...(year && { year: parseInt(year) }),
      },
      populate: { path: "user", select: "name email avatar profileUrl role" },
    })
    .populate("user", "name email avatar profileUrl role")
    .populate("preferredHostel", "name type")
    .populate("preferredBlock", "blockName blockCode")
    .populate("reviewedBy", "name")
    .sort({ submittedAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit);

  // Filter out any admin or warden accounts that mistakenly had applications
  applications = applications.filter((a) => {
    const reg = a.student?.registerNumber;
    if (reg === "ADMIN" || reg?.startsWith("WARDEN")) return false;
    const role = a.user?.role || a.student?.user?.role;
    if (role === "admin" || role === "warden") return false;
    return true;
  });

  // Filter out null students only if department or year filter was specified
  if (department || year) {
    applications = applications.filter((a) => a.student);
  }

  // Text search on student name / registerNumber / user name
  if (search) {
    const q = search.toLowerCase();
    applications = applications.filter(
      (a) =>
        a.student?.user?.name?.toLowerCase().includes(q) ||
        a.student?.registerNumber?.toLowerCase().includes(q) ||
        a.user?.name?.toLowerCase().includes(q) ||
        a.preferredBlock?.blockCode?.toLowerCase().includes(q)
    );
  }

  const total = await Application.countDocuments(filter);
  const stats = await Application.aggregate([
    { $match: academicYear ? { academicYear } : {} },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const statusCounts = {};
  stats.forEach((s) => { statusCounts[s._id] = s.count; });

  res.json({
    success: true,
    data: {
      applications,
      statusCounts,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    },
  });
};

// ─── Review Application (Admin/Warden) ───────────────────────────────────────
/**
 * @route   PATCH /api/applications/:id/review
 * @access  Private (admin, warden)
 */
exports.reviewApplication = async (req, res) => {
  const { status, reviewComments, rejectionReason, waitlistPosition } = req.body;

  const validStatuses = ["under_review", "approved", "rejected", "waitlisted"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Use: ${validStatuses.join(", ")}` });
  }

  const application = await Application.findById(req.params.id)
    .populate({ path: "student", populate: { path: "user", select: "name email" } })
    .populate("user", "name email");

  if (!application) {
    return res.status(404).json({ success: false, message: "Application not found." });
  }

  // Ensure student profile exists
  let studentDoc = application.student;
  if (!studentDoc && application.user) {
    studentDoc = await Student.findOne({ user: application.user._id || application.user });
    if (!studentDoc) {
      studentDoc = await Student.create({
        user: application.user._id || application.user,
        registerNumber: (application.user.email || "student").split("@")[0].toUpperCase(),
        department: "CSE",
        year: 1,
        gender: "male",
      });
    }
    application.student = studentDoc._id;
  }

  // Update application
  application.status = status;
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  if (reviewComments && reviewComments.trim()) {
    application.reviewComments = reviewComments.trim();
  } else if (status === "approved") {
    application.reviewComments = `Approved by ${req.user.role === "warden" ? "Warden" : "Admin"} ${req.user.name}`;
  }
  if (rejectionReason) application.rejectionReason = rejectionReason;
  if (waitlistPosition !== undefined) application.waitlistPosition = waitlistPosition;
  await application.save();

  // Update student's hostel status
  const studentStatusMap = {
    approved: "approved",
    rejected: "rejected",
    waitlisted: "waitlisted",
    under_review: "pending",
  };
  if (studentDoc && studentStatusMap[status]) {
    await Student.findByIdAndUpdate(studentDoc._id, {
      hostelStatus: studentStatusMap[status],
    });
  }

  // If approved, automatically allocate an available room to the student!
  let allocatedRoom = null;
  if (status === "approved" && studentDoc) {
    try {
      let targetRoom = await findBestRoom(application, studentDoc);
      if (!targetRoom && application.preferredBlock) {
        targetRoom = await Room.findOne({
          block: application.preferredBlock,
          status: { $in: ["available", "partially_occupied"] },
        }).populate("occupants.student");
      }
      if (!targetRoom && application.preferredHostel) {
        targetRoom = await Room.findOne({
          hostel: application.preferredHostel,
          status: { $in: ["available", "partially_occupied"] },
        }).populate("occupants.student");
      }
      if (!targetRoom) {
        const genderQuery = studentDoc.gender === "female" ? "girls" : "boys";
        const matchingHostel = await Hostel.findOne({ type: genderQuery });
        if (matchingHostel) {
          targetRoom = await Room.findOne({
            hostel: matchingHostel._id,
            status: { $in: ["available", "partially_occupied"] },
          }).populate("occupants.student");
        }
      }
      if (!targetRoom) {
        targetRoom = await Room.findOne({
          status: { $in: ["available", "partially_occupied"] },
        }).populate("occupants.student");
      }
      if (targetRoom) {
        await assignRoom(studentDoc, application, targetRoom, req.user._id);
        allocatedRoom = targetRoom;
        logger.info(`Auto-allocated room ${targetRoom.roomNumber} for student ${studentDoc.registerNumber}`);
      } else {
        logger.warn(`No available room found in database for student ${studentDoc.registerNumber}`);
      }
    } catch (allocErr) {
      logger.error(`Auto-allocation on approval notice: ${allocErr.message}`);
    }
  }

  const studentUser = application.student?.user || application.user;

  // In-app notification
  const notifMessages = {
    approved: { title: "Application Approved! 🎉", msg: "Your hostel application has been approved. Room allocation will follow soon." },
    rejected: { title: "Application Status Update", msg: `Your hostel application was not approved. Reason: ${rejectionReason || "See portal for details."}` },
    waitlisted: { title: "You're on the Waitlist", msg: `Your application is waitlisted at position #${waitlistPosition || "TBD"}. We'll notify you when a room becomes available.` },
    under_review: { title: "Application Under Review", msg: "Your hostel application is being reviewed by the warden." },
  };

  const notif = notifMessages[status];
  if (studentUser) {
    await notify(
      studentUser._id,
      req.user._id,
      status === "approved" ? "application_approved" : status === "rejected" ? "application_rejected" : "system",
      notif.title,
      notif.msg,
      { applicationId: application._id },
      "/student/application"
    );

    // Send email notification
    try {
      await sendApplicationStatusEmail(studentUser.email, studentUser.name, {
        status,
        academicYear: application.academicYear,
        reviewComments,
        rejectionReason,
        waitlistPosition,
        portalUrl: `${process.env.CLIENT_URL}/student/application`,
      });
    } catch (emailErr) {
      logger.warn(`Application status email failed: ${emailErr.message}`);
    }
  }

  logger.info(`Application ${application._id} reviewed: ${status} by ${req.user.email}`);

  res.json({ success: true, message: `Application ${status} successfully.`, data: application });
};

// ─── Cancel Application (Student) ─────────────────────────────────────────────
/**
 * @route   PATCH /api/applications/:id/cancel
 * @access  Private (student)
 */
exports.cancelApplication = async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  const application = await Application.findOne({ _id: req.params.id, student: student?._id });

  if (!application) {
    return res.status(404).json({ success: false, message: "Application not found." });
  }

  if (!["pending", "under_review", "waitlisted"].includes(application.status)) {
    return res.status(400).json({ success: false, message: `Cannot cancel application in '${application.status}' status.` });
  }

  application.status = "cancelled";
  await application.save();

  await Student.findByIdAndUpdate(student._id, { hostelStatus: "not_applied" });

  res.json({ success: true, message: "Application cancelled successfully.", data: application });
};

// ─── Delete Application (Student/Admin) ───────────────────────────────────────
/**
 * @route   DELETE /api/applications/:id
 * @access  Private (student, admin)
 */
exports.deleteApplication = async (req, res) => {
  const isStudent = req.user.role === "student";
  let filter = { _id: req.params.id };

  if (isStudent) {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student profile not found." });
    }
    filter.student = student._id;
  }

  const application = await Application.findOne(filter);
  if (!application) {
    return res.status(404).json({ success: false, message: "Application not found." });
  }

  const studentId = application.student;
  await Application.findByIdAndDelete(application._id);

  // If student has no more active applications, reset hostelStatus to not_applied
  if (studentId) {
    const remaining = await Application.findOne({
      student: studentId,
      status: { $in: ["pending", "under_review", "approved", "allocated"] },
    });
    if (!remaining) {
      await Student.findByIdAndUpdate(studentId, { hostelStatus: "not_applied" });
    }
  }

  logger.info(`Application ${req.params.id} deleted by ${req.user.email}`);

  res.json({ success: true, message: "Application deleted successfully." });
};

// ─── Bulk Delete Applications (Admin/Warden) ──────────────────────────────────
/**
 * @route   POST /api/applications/bulk-delete
 * @route   DELETE /api/applications/bulk
 * @access  Private (admin, warden)
 */
exports.bulkDeleteApplications = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of application IDs to delete.",
      });
    }

    // Find applications to identify affected students
    const applications = await Application.find({ _id: { $in: ids } });
    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No applications found matching the provided IDs.",
      });
    }

    const studentIds = [
      ...new Set(
        applications
          .map((a) => a.student?.toString())
          .filter(Boolean)
      ),
    ];

    // Delete the applications
    const deleteResult = await Application.deleteMany({ _id: { $in: ids } });

    // Reset student hostelStatus to 'not_applied' if no more active applications remain
    for (const studentId of studentIds) {
      const remaining = await Application.findOne({
        student: studentId,
        status: { $in: ["pending", "under_review", "approved", "allocated"] },
      });
      if (!remaining) {
        await Student.findByIdAndUpdate(studentId, { hostelStatus: "not_applied" });
      }
    }

    logger.info(`${deleteResult.deletedCount} applications bulk deleted by ${req.user.email}`);

    res.json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} application(s).`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    logger.error(`Error bulk deleting applications: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to bulk delete applications.",
    });
  }
};


// ─── Get Application Stats ────────────────────────────────────────────────────
/**
 * @route   GET /api/applications/stats
 * @access  Private (admin, warden)
 */
exports.getApplicationStats = async (req, res) => {
  const { academicYear } = req.query;
  const match = academicYear ? { academicYear } : {};

  const stats = await Application.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgPriority: { $avg: "$priorityScore" },
      },
    },
  ]);

  const result = { total: 0 };
  stats.forEach((s) => {
    result[s._id] = { count: s.count, avgPriority: Math.round(s.avgPriority || 0) };
    result.total += s.count;
  });

  res.json({ success: true, data: result });
};
