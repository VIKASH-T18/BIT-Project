/**
 * @file room.controller.js
 * @description Room inventory management and real-time occupancy tracking.
 */

const Room = require("../models/Room");
const Hostel = require("../models/Hostel");
const Block = require("../models/Block");

// ─── Get All Rooms ────────────────────────────────────────────────────────────
/**
 * @route   GET /api/rooms
 * @access  Private (admin, warden)
 */
exports.getRooms = async (req, res) => {
  const {
    page = 1, limit = 50, hostelId, blockId, status, roomType, isAC, search,
  } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};
  if (hostelId)  filter.hostel = hostelId;
  if (blockId)   filter.block  = blockId;
  if (status)    filter.status = status;
  if (roomType)  filter.roomType = roomType;
  if (isAC !== undefined && isAC !== "") filter.isAC = isAC === "true";

  let rooms = await Room.find(filter)
    .populate("hostel", "name type")
    .populate("block", "name blockCode")
    .populate("floor", "floorNumber")
    .populate({ path: "occupants.student", populate: { path: "user", select: "name profileUrl" } })
    .sort({ roomNumber: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  if (search) {
    const q = search.toLowerCase();
    rooms = rooms.filter((r) => r.roomNumber?.toLowerCase().includes(q));
  }

  const total = await Room.countDocuments(filter);

  const stats = await Room.aggregate([
    { $match: hostelId ? { hostel: require("mongoose").Types.ObjectId.createFromHexString(hostelId) } : {} },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalCapacity: { $sum: "$capacity" },
        totalOccupied: { $sum: "$currentOccupancy" },
      },
    },
  ]);
  const statusSummary = {};
  stats.forEach((s) => { statusSummary[s._id] = s; });

  res.json({
    success: true,
    data: {
      rooms,
      statusSummary,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    },
  });
};

// ─── Get Single Room ──────────────────────────────────────────────────────────
/**
 * @route   GET /api/rooms/:id
 * @access  Private (admin, warden)
 */
exports.getRoomById = async (req, res) => {
  const room = await Room.findById(req.params.id)
    .populate("hostel", "name type")
    .populate("block", "name blockCode")
    .populate("floor", "floorNumber")
    .populate({
      path: "occupants.student",
      populate: { path: "user", select: "name email profileUrl" },
    });

  if (!room) return res.status(404).json({ success: false, message: "Room not found." });
  res.json({ success: true, data: room });
};

// ─── Get Occupancy Overview ───────────────────────────────────────────────────
/**
 * @route   GET /api/rooms/occupancy
 * @access  Private (admin, warden)
 */
exports.getOccupancyOverview = async (req, res) => {
  const { hostelId } = req.query;
  const match = hostelId
    ? { hostel: require("mongoose").Types.ObjectId.createFromHexString(hostelId) }
    : {};

  const [byType, byBlock, overall] = await Promise.all([
    Room.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$roomType",
          totalRooms: { $sum: 1 },
          totalCapacity: { $sum: "$capacity" },
          totalOccupied: { $sum: "$currentOccupancy" },
          available: { $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] } },
          partial: { $sum: { $cond: [{ $eq: ["$status", "partially_occupied"] }, 1, 0] } },
          full: { $sum: { $cond: [{ $eq: ["$status", "fully_occupied"] }, 1, 0] } },
        },
      },
    ]),
    Room.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$block",
          totalRooms: { $sum: 1 },
          totalCapacity: { $sum: "$capacity" },
          totalOccupied: { $sum: "$currentOccupancy" },
        },
      },
      {
        $lookup: {
          from: "blocks",
          localField: "_id",
          foreignField: "_id",
          as: "blockInfo",
        },
      },
      { $unwind: { path: "$blockInfo", preserveNullAndEmpty: true } },
    ]),
    Room.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRooms: { $sum: 1 },
          totalCapacity: { $sum: "$capacity" },
          totalOccupied: { $sum: "$currentOccupancy" },
          available: { $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] } },
          partial: { $sum: { $cond: [{ $eq: ["$status", "partially_occupied"] }, 1, 0] } },
          full: { $sum: { $cond: [{ $eq: ["$status", "fully_occupied"] }, 1, 0] } },
          maintenance: { $sum: { $cond: [{ $eq: ["$status", "maintenance"] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const summary = overall[0] || {};
  const occupancyRate = summary.totalCapacity > 0
    ? Math.round((summary.totalOccupied / summary.totalCapacity) * 100)
    : 0;

  res.json({
    success: true,
    data: {
      summary: { ...summary, occupancyRate },
      byType,
      byBlock,
    },
  });
};

// ─── Update Room (Admin) ──────────────────────────────────────────────────────
/**
 * @route   PATCH /api/rooms/:id
 * @access  Private (admin)
 */
exports.updateRoom = async (req, res) => {
  const allowedFields = ["status", "monthlyFee", "securityDeposit", "amenities", "description", "notes", "isAC"];
  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const room = await Room.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!room) return res.status(404).json({ success: false, message: "Room not found." });

  res.json({ success: true, message: "Room updated.", data: room });
};
