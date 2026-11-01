/**
 * @file allocation.routes.js
 * @description Allocation API routes — room allocation, vacate, transfer, bulk smart.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  getAllAllocations,
  getMyAllocation,
  getDashboardStats,
  allocateRoom,
  runBulkAllocation,
  vacateRoom,
  transferRoom,
  promoteWaitlist,
} = require("../controllers/allocation.controller");

// ─── Student Routes ───────────────────────────────────────────────────────────

/** GET /api/allocations/my — student's own allocation + QR */
router.get("/my", authenticate, getMyAllocation);

// ─── Admin / Warden Routes ────────────────────────────────────────────────────

/** GET /api/allocations/dashboard — admin occupancy stats */
router.get("/dashboard", authenticate, authorize("admin", "warden"), getDashboardStats);

/** GET /api/allocations — list all allocations */
router.get("/", authenticate, authorize("admin", "warden"), getAllAllocations);

/** POST /api/allocations/manual — manual single allocation */
router.post("/manual", authenticate, authorize("admin", "warden"), allocateRoom);

/** POST /api/allocations/bulk-smart — trigger smart bulk allocation */
router.post("/bulk-smart", authenticate, authorize("admin"), runBulkAllocation);

/** POST /api/allocations/promote-waitlist — promote next waitlisted student */
router.post("/promote-waitlist", authenticate, authorize("admin", "warden"), promoteWaitlist);

/** PATCH /api/allocations/:id/vacate — vacate a room */
router.patch("/:id/vacate", authenticate, authorize("admin", "warden"), vacateRoom);

/** POST /api/allocations/:id/transfer — transfer to another room */
router.post("/:id/transfer", authenticate, authorize("admin", "warden"), transferRoom);

module.exports = router;
