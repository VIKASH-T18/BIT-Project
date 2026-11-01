/**
 * @file allocation.controller.js
 * @description Room allocation management — manual, bulk smart, vacate, transfer.
 * Sends email + in-app notifications on allocation events.
 */

const Allocation = require("../models/Allocation");
const Application = require("../models/Application");
const Room = require("../models/Room");
const Student = require("../models/Student");
const Hostel = require("../models/Hostel");
const Notification = require("../models/Notification");
const {
  assignRoom,
  runSmartAllocation,
  findBestRoom,
  promoteFromWaitlist,
} = require("../services/allocation.service");
const { sendAllocationEmail } = require("../config/nodemailer");
const logger = require("../utils/logger");

// ─── Helper: In-app notification ─────────────────────────────────────────────
const notify = async (recipientId, senderId, type, title, message, data = {}, actionUrl) => {
  try {
    await Notification.create({ recipient: recipientId, sender: senderId, type, title, message, data, actionUrl, priority: "high" });
  } catch (err) {
    logger.warn(`Notification failed: ${err.message}`);
  }
};

// ─── Get All Allocations ──────────────────────────────────────────────────────
/**
 * @route   GET /api/allocations
 * @access  Private (admin, warden)
 */
exports.getAllAllocations = async (req, res) => {
  const { page = 1, limit = 20, status = "active", hostelId, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};
  if (status) filter.status = status;
  if (hostelId) filter.hostel = hostelId;

  let allocations = await Allocation.find(filter)
    .populate({ path: "student", populate: { path: "user", select: "name email profileUrl" } })
    .populate("room", "roomNumber roomType floorNumber isAC")
    .populate("block", "name blockCode")
    .populate("hostel", "name type")
    .populate("allocatedBy", "name")
    .sort({ allocationDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  if (search) {
    const q = search.toLowerCase();
    allocations = allocations.filter(
      (a) =>
        a.student?.user?.name?.toLowerCase().includes(q) ||
        a.student?.registerNumber?.toLowerCase().includes(q) ||
        a.room?.roomNumber?.toLowerCase().includes(q)
    );
  }

  const total = await Allocation.countDocuments(filter);

  res.json({
    success: true,
    data: {
      allocations,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    },
  });
};

// ─── Get My Allocation (Student) ──────────────────────────────────────────────
/**
 * @route   GET /api/allocations/my
 * @access  Private (student)
 */
exports.getMyAllocation = async (req, res) => {
  let student = null;
  if (req.user.role === "student") {
    student = await Student.findOne({ user: req.user._id });
    if (!student) {
      student = await Student.create({
        user: req.user._id,
        registerNumber: req.user.email ? req.user.email.split("@")[0].toUpperCase() : `REG-${Date.now().toString().slice(-4)}`,
        department: "General",
        year: 1,
        gender: "male",
      });
    }
  } else {
    student = (await Student.findOne({ registerNumber: "231EC322" })) || (await Student.findOne({ user: { $exists: true } }));
  }

  if (!student) {
    return res.json({ success: true, data: null, application: null });
  }

  // Fetch the latest application for this student
  const application = await Application.findOne({
    $or: [{ student: student._id }, { user: student.user || req.user._id }],
  })
    .populate("preferredHostel", "name type")
    .populate("preferredBlock", "blockName blockCode name")
    .populate("reviewedBy", "name email role")
    .sort({ createdAt: -1 });

  let allocation = await Allocation.findOne({
    $or: [{ student: student._id }, { user: req.user._id }],
    status: "active",
  })
    .populate("room", "roomNumber roomType floorNumber isAC amenities capacity currentOccupancy occupants monthlyFee")
    .populate({ path: "room", populate: { path: "occupants.student", populate: { path: "user", select: "name profileUrl avatar" } } })
    .populate("block", "name blockCode")
    .populate("floor", "floorNumber")
    .populate("hostel", "name type address")
    .populate("allocatedBy", "name");

  // If application is approved or allocated, but no active allocation record exists, auto-assign an available room!
  if ((!allocation || !allocation.room) && application && (application.status === "approved" || application.status === "allocated" || student.hostelStatus === "approved" || student.hostelStatus === "allocated")) {
    try {
      let targetRoom = await findBestRoom(application, student);
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
        const genderQuery = student.gender === "female" ? "girls" : "boys";
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
        await assignRoom(student, application, targetRoom, req.user._id);
        allocation = await Allocation.findOne({
          $or: [{ student: student._id }, { user: req.user._id }],
          status: "active",
        })
          .populate("room", "roomNumber roomType floorNumber isAC amenities capacity currentOccupancy occupants monthlyFee")
          .populate({ path: "room", populate: { path: "occupants.student", populate: { path: "user", select: "name profileUrl avatar" } } })
          .populate("block", "name blockCode")
          .populate("floor", "floorNumber")
          .populate("hostel", "name type address")
          .populate("allocatedBy", "name");
      }
    } catch (allocErr) {
      logger.warn(`Could not auto-assign room for approved student: ${allocErr.message}`);
    }
  }

  res.json({
    success: true,
    data: allocation || null,
    application: application || null,
    message: allocation ? "Room allocation retrieved." : "No active room allocation found.",
  });
};

// ─── Get Admin Dashboard Stats ────────────────────────────────────────────────
/**
 * @route   GET /api/allocations/dashboard
 * @access  Private (admin, warden)
 */
exports.getDashboardStats = async (req, res) => {
  const [
    totalActive,
    totalVacated,
    totalRooms,
    availableRooms,
    fullyOccupied,
    pendingApps,
  ] = await Promise.all([
    Allocation.countDocuments({ status: "active" }),
    Allocation.countDocuments({ status: "vacated" }),
    Room.countDocuments(),
    Room.countDocuments({ status: "available" }),
    Room.countDocuments({ status: "fully_occupied" }),
    Application.countDocuments({ status: { $in: ["pending", "under_review"] } }),
  ]);

  const occupancyRate = totalRooms > 0
    ? Math.round(((totalRooms - availableRooms) / totalRooms) * 100)
    : 0;

  const recentAllocations = await Allocation.find({ status: "active" })
    .populate({ path: "student", populate: { path: "user", select: "name" } })
    .populate("room", "roomNumber")
    .populate("block", "name")
    .sort({ allocationDate: -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      totalStudentsAllocated: totalActive,
      totalVacated,
      totalRooms,
      availableRooms,
      fullyOccupied,
      partiallyOccupied: totalRooms - availableRooms - fullyOccupied,
      occupancyRate,
      pendingApplications: pendingApps,
      recentAllocations,
    },
  });
};

// ─── Manual Single Allocation (Admin/Warden) ──────────────────────────────────
/**
 * @route   POST /api/allocations/manual
 * @access  Private (admin, warden)
 */
exports.allocateRoom = async (req, res) => {
  const { studentId, applicationId, roomId } = req.body;

  if (!studentId || !roomId) {
    return res.status(400).json({ success: false, message: "studentId and roomId are required." });
  }

  const [student, room] = await Promise.all([
    Student.findById(studentId).populate("user", "name email"),
    Room.findById(roomId).populate("occupants.student"),
  ]);

  if (!student) return res.status(404).json({ success: false, message: "Student not found." });
  if (!room)    return res.status(404).json({ success: false, message: "Room not found." });

  if (room.currentOccupancy >= room.capacity) {
    return res.status(400).json({ success: false, message: "Room is fully occupied." });
  }

  let application = null;
  if (applicationId) {
    application = await Application.findById(applicationId);
  } else {
    // Try to find an existing application
    const y = new Date().getFullYear();
    const currentYear = `${y}-${(y + 1).toString().slice(2)}`;
    application = await Application.findOne({ student: student._id, academicYear: currentYear });
    if (!application) {
      // Create minimal application record
      application = await Application.create({
        student: student._id,
        user: student.user._id,
        academicYear: `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(2)}`,
        preferredHostel: room.hostel,
        preferredRoomType: room.roomType,
        status: "approved",
      });
    }
  }

  const allocation = await assignRoom(student, application, room, req.user._id);

  // Re-fetch allocation with populated data for email
  const populated = await Allocation.findById(allocation._id)
    .populate("block", "name blockCode")
    .populate("floor", "floorNumber")
    .populate("hostel", "name");

  // Send email
  try {
    await sendAllocationEmail(student.user.email, student.user.name, {
      block:    populated.block?.name || populated.block?.blockCode || "—",
      floor:    `Floor ${populated.floor?.floorNumber || "—"}`,
      roomNo:   room.roomNumber,
      bed:      allocation.bedNumber,
      roomType: room.roomType.replace("_", " "),
      hostel:   populated.hostel?.name || "BIT Hostel",
      academicYear: allocation.academicYear,
    });
  } catch (err) {
    logger.warn(`Allocation email failed: ${err.message}`);
  }

  // In-app notification
  await notify(
    student.user._id,
    req.user._id,
    "room_allocated",
    "🏠 Room Allocated!",
    `You have been allocated to Room ${room.roomNumber}, Bed ${allocation.bedNumber}.`,
    { allocationId: allocation._id, roomId: room._id },
    "/student/allocation"
  );

  logger.info(`Manual allocation: ${student.registerNumber} → Room ${room.roomNumber} Bed ${allocation.bedNumber}`);

  res.status(201).json({
    success: true,
    message: `Room ${room.roomNumber} (Bed ${allocation.bedNumber}) allocated to ${student.user.name}.`,
    data: allocation,
  });
};

// ─── Bulk Smart Allocation ────────────────────────────────────────────────────
/**
 * @route   POST /api/allocations/bulk-smart
 * @access  Private (admin)
 */
exports.runBulkAllocation = async (req, res) => {
  const { hostelId } = req.body;

  if (!hostelId) {
    return res.status(400).json({ success: false, message: "hostelId is required." });
  }

  const hostel = await Hostel.findById(hostelId);
  if (!hostel) return res.status(404).json({ success: false, message: "Hostel not found." });

  logger.info(`Bulk smart allocation started for hostel: ${hostel.name} by ${req.user.email}`);

  const result = await runSmartAllocation(hostelId, req.user._id);

  // Notify all newly allocated students
  const newAllocations = await Allocation.find({
    hostel: hostelId,
    status: "active",
    allocationDate: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // last 5 mins
  }).populate({ path: "student", populate: { path: "user", select: "name email" } })
    .populate("room", "roomNumber")
    .populate("block", "name blockCode")
    .populate("floor", "floorNumber");

  const emailErrors = [];
  for (const alloc of newAllocations) {
    if (alloc.student?.user) {
      try {
        await sendAllocationEmail(alloc.student.user.email, alloc.student.user.name, {
          block: alloc.block?.name || alloc.block?.blockCode || "—",
          floor: `Floor ${alloc.floor?.floorNumber || "—"}`,
          roomNo: alloc.room?.roomNumber || "—",
          bed: alloc.bedNumber,
          roomType: alloc.room?.roomType?.replace("_", " ") || "—",
          hostel: hostel.name,
          academicYear: alloc.academicYear,
        });
        await notify(
          alloc.student.user._id,
          req.user._id,
          "room_allocated",
          "🏠 Room Allocated!",
          `Room ${alloc.room?.roomNumber}, Bed ${alloc.bedNumber} in ${alloc.block?.name || "Block"}.`,
          { allocationId: alloc._id },
          "/student/allocation"
        );
      } catch (err) {
        emailErrors.push(alloc.student.registerNumber);
      }
    }
  }

  logger.info(`Bulk allocation complete: ${result.allocated} allocated, ${result.waitlisted} waitlisted`);

  res.json({
    success: true,
    message: `Bulk allocation complete! ${result.allocated} students allocated, ${result.waitlisted} waitlisted.`,
    data: {
      ...result,
      emailErrors,
      hostelName: hostel.name,
    },
  });
};

// ─── Vacate Room ──────────────────────────────────────────────────────────────
/**
 * @route   PATCH /api/allocations/:id/vacate
 * @access  Private (admin, warden)
 */
exports.vacateRoom = async (req, res) => {
  const { reason } = req.body;

  const allocation = await Allocation.findById(req.params.id)
    .populate({ path: "student", populate: { path: "user", select: "name email" } })
    .populate("room");

  if (!allocation) {
    return res.status(404).json({ success: false, message: "Allocation not found." });
  }
  if (allocation.status !== "active") {
    return res.status(400).json({ success: false, message: "Allocation is not active." });
  }

  // Update allocation
  allocation.status = "vacated";
  allocation.vacatedAt = new Date();
  allocation.checkOutDate = new Date();
  if (reason) allocation.notes = reason;
  await allocation.save();

  // Remove from room
  const room = await Room.findById(allocation.room._id);
  if (room) {
    room.occupants = room.occupants.filter(
      (o) => o.student.toString() !== allocation.student._id.toString()
    );
    await room.save();
  }

  // Update student status
  await Student.findByIdAndUpdate(allocation.student._id, {
    hostelStatus: "checked_out",
    isHostelStudent: false,
  });

  if (allocation.student?.user) {
    await notify(
      allocation.student.user._id,
      req.user._id,
      "room_transfer",
      "Room Vacated",
      `Your allocation for Room ${room?.roomNumber || "—"} has been vacated. ${reason ? `Reason: ${reason}` : ""}`,
      { allocationId: allocation._id },
      "/student/allocation"
    );
  }

  logger.info(`Room vacated: ${allocation.student?.registerNumber} from Room ${room?.roomNumber}`);
  res.json({ success: true, message: "Room vacated successfully.", data: allocation });
};

// ─── Transfer Room ────────────────────────────────────────────────────────────
/**
 * @route   POST /api/allocations/:id/transfer
 * @access  Private (admin, warden)
 */
exports.transferRoom = async (req, res) => {
  const { newRoomId, reason } = req.body;

  if (!newRoomId) {
    return res.status(400).json({ success: false, message: "newRoomId is required." });
  }

  const [allocation, newRoom] = await Promise.all([
    Allocation.findById(req.params.id)
      .populate({ path: "student", populate: { path: "user", select: "name email" } })
      .populate("room"),
    Room.findById(newRoomId).populate("occupants.student"),
  ]);

  if (!allocation) return res.status(404).json({ success: false, message: "Allocation not found." });
  if (!newRoom)    return res.status(404).json({ success: false, message: "Target room not found." });

  if (newRoom.currentOccupancy >= newRoom.capacity) {
    return res.status(400).json({ success: false, message: "Target room is fully occupied." });
  }

  // Remove from old room
  const oldRoom = await Room.findById(allocation.room._id);
  if (oldRoom) {
    oldRoom.occupants = oldRoom.occupants.filter(
      (o) => o.student.toString() !== allocation.student._id.toString()
    );
    await oldRoom.save();
  }

  // Determine bed in new room
  const occupiedBeds = newRoom.occupants.map((o) => parseInt(o.bedNumber?.replace("B", "") || 0));
  let bedNum = 1;
  while (occupiedBeds.includes(bedNum)) bedNum++;
  const newBedNumber = `B${bedNum}`;

  // Add to new room
  newRoom.occupants.push({ student: allocation.student._id, bedNumber: newBedNumber, allocatedAt: new Date() });
  await newRoom.save();

  // Update allocation
  allocation.room = newRoomId;
  allocation.bedNumber = newBedNumber;
  allocation.block = newRoom.block;
  allocation.floor = newRoom.floor;
  allocation.hostel = newRoom.hostel;
  allocation.transferredTo = newRoomId;
  allocation.transferReason = reason;
  allocation.status = "active";
  await allocation.save();

  if (allocation.student?.user) {
    await notify(
      allocation.student.user._id,
      req.user._id,
      "room_transfer",
      "Room Transfer Notification",
      `You have been transferred to Room ${newRoom.roomNumber}, Bed ${newBedNumber}. ${reason ? `Reason: ${reason}` : ""}`,
      { allocationId: allocation._id, newRoomId },
      "/student/allocation"
    );
  }

  logger.info(`Room transfer: ${allocation.student?.registerNumber} → Room ${newRoom.roomNumber} Bed ${newBedNumber}`);

  res.json({
    success: true,
    message: `Student transferred to Room ${newRoom.roomNumber} (Bed ${newBedNumber}).`,
    data: allocation,
  });
};

// ─── Promote from Waitlist ────────────────────────────────────────────────────
/**
 * @route   POST /api/allocations/promote-waitlist
 * @access  Private (admin, warden)
 */
exports.promoteWaitlist = async (req, res) => {
  const { hostelId } = req.body;
  if (!hostelId) return res.status(400).json({ success: false, message: "hostelId required." });

  const allocation = await promoteFromWaitlist(hostelId, req.user._id);
  if (!allocation) {
    return res.json({ success: true, message: "No waitlisted students to promote, or no rooms available.", data: null });
  }

  res.json({
    success: true,
    message: "Waitlisted student promoted and room allocated.",
    data: allocation,
  });
};
