/**
 * @file hostel.routes.js
 * @description Hostel facilities & block layout API routes.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const Hostel = require("../models/Hostel");
const Block = require("../models/Block");
const Room = require("../models/Room");

/**
 * GET /api/hostels
 * Fetch all hostels with block counts and occupancy.
 */
router.get("/", authenticate, async (req, res) => {
  const hostels = await Hostel.find({ isActive: true })
    .populate({
      path: "blocks",
      match: { isActive: true },
      select: "name blockCode totalFloors totalRooms",
    })
    .sort({ name: 1 });

  res.json({
    success: true,
    data: hostels,
  });
});

/**
 * GET /api/hostels/:id/blocks
 * Get all active blocks for a hostel (used in application form).
 */
router.get("/:id/blocks", authenticate, async (req, res) => {
  const mongoose = require("mongoose");
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.json({ success: true, data: [] });
  }

  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) return res.status(404).json({ success: false, message: "Hostel not found" });

  const blocks = await Block.find({ hostel: hostel._id, isActive: true })
    .select("blockName blockCode totalRooms totalFloors gender description")
    .sort({ blockName: 1 });

  res.json({ success: true, data: blocks });
});

/**
 * GET /api/hostels/:id/layout
 * Get interactive map layout for a specific hostel.
 */
router.get("/:id/layout", authenticate, async (req, res) => {
  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) return res.status(404).json({ success: false, message: "Hostel not found" });

  const blocks = await Block.find({ hostel: hostel._id });
  const blockIds = blocks.map((b) => b._id);
  const rooms = await Room.find({ block: { $in: blockIds } }).select(
    "roomNumber floorNumber status capacity currentOccupancy roomType block"
  );

  res.json({
    success: true,
    data: {
      hostel,
      blocks,
      rooms,
    },
  });
});

module.exports = router;
