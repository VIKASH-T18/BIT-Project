/**
 * @file warden.routes.js
 * @description Warden management API routes.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  getWardens,
  getWardenById,
  updateWarden,
  getWardenDashboard,
  updateLeaveStatus,
  updateComplaintStatus,
} = require("../controllers/warden.controller");

/** GET /api/wardens/dashboard — warden dashboard feed */
router.get("/dashboard", authenticate, authorize("warden", "admin"), getWardenDashboard);

/** PATCH /api/wardens/leaves/:id/status — quick leave approve/reject */
router.patch("/leaves/:id/status", authenticate, authorize("warden", "admin"), updateLeaveStatus);

/** PATCH /api/wardens/complaints/:id/status — quick complaint status update */
router.patch("/complaints/:id/status", authenticate, authorize("warden", "admin"), updateComplaintStatus);

/** GET /api/wardens — list all wardens */
router.get("/",       authenticate, authorize("admin"), getWardens);

/** GET /api/wardens/:id — single warden */
router.get("/:id",    authenticate, authorize("admin"), getWardenById);

/** PATCH /api/wardens/:id — update warden */
router.patch("/:id",  authenticate, authorize("admin"), updateWarden);

module.exports = router;

