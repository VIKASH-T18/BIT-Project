/**
 * @file room.routes.js
 * @description Room management API routes.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  getRooms,
  getRoomById,
  getOccupancyOverview,
  updateRoom,
} = require("../controllers/room.controller");

// ─── Admin / Warden Routes ────────────────────────────────────────────────────

/** GET /api/rooms/occupancy — real-time occupancy stats */
router.get("/occupancy", authenticate, authorize("admin", "warden"), getOccupancyOverview);

/** GET /api/rooms — list all rooms with filters */
router.get("/", authenticate, authorize("admin", "warden"), getRooms);

/** GET /api/rooms/:id — single room detail */
router.get("/:id", authenticate, authorize("admin", "warden"), getRoomById);

/** PATCH /api/rooms/:id — update room */
router.patch("/:id", authenticate, authorize("admin"), updateRoom);

module.exports = router;
