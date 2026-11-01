/**
 * @file allocation.service.js
 * @description Smart Room Allocation Algorithm.
 *
 * Priority-based scoring system:
 * - Year (Final year gets highest priority)
 * - Medical/Disability requirements
 * - Distance from home
 * - Merit/Scholarship
 * - Compatibility score with existing roommates
 */

const Application = require("../models/Application");
const Allocation  = require("../models/Allocation");
const Room        = require("../models/Room");
const Student     = require("../models/Student");
const Hostel      = require("../models/Hostel");
const { calculateCompatibility } = require("./compatibility.service");
const CompatibilityProfile = require("../models/CompatibilityProfile");
const QRCode = require("qrcode");
const logger = require("../utils/logger");

// ─── Priority Score Calculator ────────────────────────────────────────────────

/**
 * Calculate application priority score.
 * @param {object} application - Application document (populated)
 * @param {object} student - Student document
 * @returns {number} Priority score (0–100)
 */
const calculatePriorityScore = (application, student) => {
  let score = 0;

  // Year-based priority (40 points max)
  const yearScores = { 4: 40, 5: 40, 3: 30, 2: 20, 1: 10 };
  score += yearScores[student.year] || 10;

  // Medical/Disability (30 points)
  if (application.priorityReasons?.hasDisability || student.hasDisability) score += 30;
  else if (application.priorityReasons?.hasMedical || student.hasMedicalCondition) score += 20;

  // Scholarship (15 points)
  if (application.priorityReasons?.isScholarship || student.isScholarshipHolder) score += 15;

  // Distance from home (0–15 points)
  const dist = application.priorityReasons?.distanceKm || student.distanceFromCollege || 0;
  if (dist > 1000)     score += 15;
  else if (dist > 500) score += 10;
  else if (dist > 200) score += 7;
  else if (dist > 100) score += 4;

  // CGPA-based merit (0–10 points)
  if (student.cgpa) {
    score += Math.round((student.cgpa / 10) * 10);
  }

  return Math.min(score, 100);
};

// ─── Find Best Room ───────────────────────────────────────────────────────────

/**
 * Find the best available room for a student application.
 * Considers room type preference, AC preference, floor preference,
 * and compatibility with existing occupants.
 *
 * @param {object} application - Application with preferences
 * @param {object} student - Student document
 * @param {string} hostelId - Target hostel ID
 * @returns {object|null} Best room or null if none available
 */
const findBestRoom = async (application, student) => {
  // Check if student currently has an active room allocation
  const currentAlloc = await Allocation.findOne({ student: student._id, status: "active" });
  const currentRoomId = currentAlloc?.room;

  // Build candidate queries in priority order so preferredBlock and new hostel are strictly honored
  const baseStatus = { $in: ["available", "partially_occupied"] };
  const excludeCurrent = currentRoomId ? { _id: { $ne: currentRoomId } } : {};

  const candidateQueries = [];

  // Priority 1: Exact match with preferredBlock, preferredRoomType, and AC preference
  if (application.preferredBlock) {
    const q1 = {
      block: application.preferredBlock,
      status: baseStatus,
      ...excludeCurrent,
    };
    if (application.preferredRoomType) q1.roomType = application.preferredRoomType;
    if (application.preferredAC !== undefined) q1.isAC = application.preferredAC;
    candidateQueries.push(q1);

    // Priority 2: In preferredBlock with preferredRoomType (relax AC if needed)
    if (application.preferredAC !== undefined) {
      const q2 = {
        block: application.preferredBlock,
        status: baseStatus,
        ...excludeCurrent,
      };
      if (application.preferredRoomType) q2.roomType = application.preferredRoomType;
      candidateQueries.push(q2);
    }

    // Priority 3: Any available room in preferredBlock
    candidateQueries.push({
      block: application.preferredBlock,
      status: baseStatus,
      ...excludeCurrent,
    });
  }

  // Priority 4: In preferredHostel with preferredRoomType and AC preference
  if (application.preferredHostel) {
    const q4 = {
      hostel: application.preferredHostel,
      status: baseStatus,
      ...excludeCurrent,
    };
    if (application.preferredRoomType) q4.roomType = application.preferredRoomType;
    if (application.preferredAC !== undefined) q4.isAC = application.preferredAC;
    candidateQueries.push(q4);

    // Priority 5: In preferredHostel (any room)
    candidateQueries.push({
      hostel: application.preferredHostel,
      status: baseStatus,
      ...excludeCurrent,
    });
  }

  // Priority 6: Any room in gender-appropriate hostel
  const genderQuery = student.gender === "female" ? "girls" : "boys";
  const matchingHostel = await Hostel.findOne({ type: genderQuery });
  if (matchingHostel) {
    candidateQueries.push({
      hostel: matchingHostel._id,
      status: baseStatus,
      ...excludeCurrent,
    });
  }

  // Priority 7: Any available room anywhere excluding current room
  candidateQueries.push({
    status: baseStatus,
    ...excludeCurrent,
  });

  // Try candidate queries in order until rooms are found
  let availableRooms = [];
  for (const q of candidateQueries) {
    availableRooms = await Room.find(q)
      .populate("occupants.student")
      .sort({ currentOccupancy: -1 });
    if (availableRooms.length > 0) break;
  }

  // If still no rooms found (e.g. only current room exists in whole system), fall back without exclusion
  if (availableRooms.length === 0) {
    availableRooms = await Room.find({ status: baseStatus }).populate("occupants.student");
  }

  if (availableRooms.length === 0) return null;

  // Compatibility matching if student profile is complete
  const myProfile = await CompatibilityProfile.findOne({ student: student._id });
  if (!myProfile || !myProfile.isComplete) {
    return availableRooms[0];
  }

  // Score rooms by compatibility with existing occupants
  const scoredRooms = await Promise.all(
    availableRooms.map(async (room) => {
      if (room.occupants.length === 0) {
        return { room, score: 70 }; // Baseline for empty rooms
      }

      let totalScore = 0;
      let count = 0;
      for (const occupant of room.occupants) {
        if (!occupant.student) continue;
        const theirProfile = await CompatibilityProfile.findOne({ student: occupant.student._id || occupant.student });
        if (theirProfile && theirProfile.isComplete) {
          const result = calculateCompatibility(myProfile, theirProfile);
          totalScore += result.score;
          count++;
        }
      }

      const compatScore = count > 0 ? totalScore / count : 70;
      const fillBonus = room.currentOccupancy > 0 ? 10 : 0;
      return { room, score: compatScore + fillBonus };
    })
  );

  scoredRooms.sort((a, b) => b.score - a.score);
  return scoredRooms[0].room;
};

// ─── Assign Room ──────────────────────────────────────────────────────────────

/**
 * Assign a student to a room and bed.
 * Creates allocation record, updates room occupancy, generates QR.
 *
 * @param {object} student - Student document
 * @param {object} application - Application document
 * @param {object} room - Room document
 * @param {string} adminId - ID of admin/warden performing allocation
 * @returns {object} Allocation document
 */
const assignRoom = async (student, application, room, adminId) => {
  const academicYear = new Date().getFullYear();
  const currentAcademicYear = `${academicYear}-${(academicYear + 1).toString().slice(2)}`;

  // Check if student has an existing allocation for this academic year (or any active allocation)
  let allocation = await Allocation.findOne({
    $or: [
      { student: student._id, academicYear: currentAcademicYear },
      { student: student._id, status: "active" },
    ],
  });

  if (allocation && allocation.room) {
    try {
      const oldRoom = await Room.findById(allocation.room);
      if (oldRoom && oldRoom._id.toString() !== room._id.toString()) {
        oldRoom.occupants = (oldRoom.occupants || []).filter(
          (o) => o.student?.toString() !== student._id.toString()
        );
        oldRoom.currentOccupancy = oldRoom.occupants.length;
        oldRoom.status = oldRoom.currentOccupancy >= oldRoom.capacity ? "fully_occupied" : "available";
        await oldRoom.save();
      }
    } catch (rmErr) {
      logger.warn(`Notice while vacating old room: ${rmErr.message}`);
    }
  }

  // Determine next available bed number
  const occupiedBeds = (room.occupants || []).map((o) => parseInt(o.bedNumber?.replace("B", "") || 0));
  let bedNumber = 1;
  while (occupiedBeds.includes(bedNumber)) bedNumber++;
  const bedNo = `B${bedNumber}`;

  // Generate QR code data safely
  let qrCodeUrl = "";
  try {
    const qrData = JSON.stringify({
      type:     "room_allocation",
      studentId: student._id,
      regNo:    student.registerNumber,
      roomNo:   room.roomNumber,
      bedNo,
      block:    room.block,
      academicYear: currentAcademicYear,
      issuedAt: new Date().toISOString(),
    });
    qrCodeUrl = await QRCode.toDataURL(qrData);
  } catch (qrErr) {
    logger.warn(`QR generation notice: ${qrErr.message}`);
    qrCodeUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50">QR-${student.registerNumber}</text></svg>`;
  }

  const userId = student.user?._id || student.user || application?.user?._id || application?.user;

  // If allocation document already exists, update it to satisfy { student: 1, academicYear: 1 } unique index
  if (allocation) {
    allocation.user = userId;
    allocation.application = application?._id;
    allocation.hostel = room.hostel;
    allocation.block = room.block;
    allocation.floor = room.floor;
    allocation.room = room._id;
    allocation.bedNumber = bedNo;
    allocation.academicYear = currentAcademicYear;
    allocation.allocationDate = new Date();
    allocation.allocatedBy = adminId;
    allocation.qrCode = qrCodeUrl;
    allocation.status = "active";
    await allocation.save();
  } else {
    allocation = await Allocation.create({
      student:      student._id,
      user:         userId,
      application:  application?._id,
      hostel:       room.hostel,
      block:        room.block,
      floor:        room.floor,
      room:         room._id,
      bedNumber:    bedNo,
      academicYear: currentAcademicYear,
      allocationDate: new Date(),
      allocatedBy:  adminId,
      qrCode:       qrCodeUrl,
      status:       "active",
    });
  }

  // Update room occupants & occupancy count
  if (!room.occupants) room.occupants = [];
  room.occupants = room.occupants.filter((o) => o.student?.toString() !== student._id.toString());
  room.occupants.push({ student: student._id, bedNumber: bedNo, allocatedAt: new Date() });
  room.currentOccupancy = room.occupants.length;
  if (room.currentOccupancy >= room.capacity) {
    room.status = "fully_occupied";
  } else if (room.currentOccupancy > 0) {
    room.status = "partially_occupied";
  } else {
    room.status = "available";
  }
  await room.save();

  // Update student status
  await Student.findByIdAndUpdate(student._id, {
    hostelStatus: "allocated",
    hostelJoinDate: new Date(),
    isHostelStudent: true,
  });

  // Update application status
  if (application?._id) {
    await Application.findByIdAndUpdate(application._id, { status: "allocated" });
  }

  logger.info(`Room allocated: Student ${student.registerNumber} → Room ${room.roomNumber} Bed ${bedNo}`);

  return allocation;
};

// ─── Bulk Smart Allocation ────────────────────────────────────────────────────

/**
 * Smart bulk allocation: process all approved pending applications.
 * Sorts by priority score, allocates best available room to each.
 *
 * @param {string} hostelId - Target hostel
 * @param {string} adminId - Admin performing allocation
 * @returns {{ allocated: number, waitlisted: number, failed: string[] }}
 */
const runSmartAllocation = async (hostelId, adminId) => {
  // Get all approved, unallocated applications
  const applications = await Application.find({
    status: "approved",
    preferredHostel: hostelId,
  }).populate({
    path: "student",
    populate: { path: "user", select: "name email" },
  });

  if (applications.length === 0) {
    return { allocated: 0, waitlisted: 0, failed: [] };
  }

  // Sort by priority score (highest first)
  const sorted = applications
    .map((app) => ({
      application: app,
      priority: calculatePriorityScore(app, app.student),
    }))
    .sort((a, b) => b.priority - a.priority);

  let allocated = 0, waitlisted = 0;
  const failed = [];

  for (const { application, priority } of sorted) {
    try {
      // Update priority score
      application.priorityScore = priority;
      await application.save();

      const room = await findBestRoom(application, application.student);

      if (!room) {
        // Add to waitlist
        await Application.findByIdAndUpdate(application._id, {
          status: "waitlisted",
          waitlistPosition: waitlisted + 1,
        });
        waitlisted++;
        continue;
      }

      await assignRoom(application.student, application, room, adminId);
      allocated++;
    } catch (err) {
      logger.error(`Allocation failed for student ${application.student?.registerNumber}: ${err.message}`);
      failed.push(`${application.student?.registerNumber}: ${err.message}`);
    }
  }

  return { allocated, waitlisted, failed };
};

// ─── Waitlist Promotion ───────────────────────────────────────────────────────

/**
 * When a room becomes available, promote the next waitlisted student.
 * @param {string} hostelId
 * @param {string} adminId
 */
const promoteFromWaitlist = async (hostelId, adminId) => {
  const waitlisted = await Application.find({
    status: "waitlisted",
    preferredHostel: hostelId,
  })
    .sort({ waitlistPosition: 1 })
    .limit(1)
    .populate("student");

  if (waitlisted.length === 0) return null;

  const application = waitlisted[0];
  const room = await findBestRoom(application, application.student);

  if (!room) return null;

  const allocation = await assignRoom(application.student, application, room, adminId);
  return allocation;
};

module.exports = {
  calculatePriorityScore,
  findBestRoom,
  assignRoom,
  runSmartAllocation,
  promoteFromWaitlist,
};
