/**
 * @file admin.routes.js
 * @description Admin overview, management, and system settings API routes.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { getOverview, getStudentStats } = require("../controllers/admin.controller");

// Default system settings store
let systemSettings = {
  academicYear: "2025-2026",
  hostelRegistrationOpen: true,
  autoAllocationEnabled: false,
  curfewTime: "21:30",
  lateFeePerDay: 50,
  maxLeaveDaysPerMonth: 7,
  emailNotifications: true,
  smsAlerts: false,
  maintenanceMode: false,
  allowStudentRoommateMatching: true,
  messFeeDueDayOfMonth: 5,
};

/** GET /api/admins/overview — full admin dashboard stats */
router.get("/overview", authenticate, authorize("admin", "warden"), getOverview);

/** GET /api/admins/students/stats — student breakdown stats */
router.get("/students/stats", authenticate, authorize("admin", "warden"), getStudentStats);

/** GET /api/admins/settings — get portal configuration */
router.get("/settings", authenticate, authorize("admin"), (req, res) => {
  res.json({
    success: true,
    data: systemSettings,
  });
});

/** PATCH /api/admins/settings — update portal configuration */
router.patch("/settings", authenticate, authorize("admin"), (req, res) => {
  systemSettings = {
    ...systemSettings,
    ...req.body,
  };
  res.json({
    success: true,
    message: "System settings updated successfully.",
    data: systemSettings,
  });
});

module.exports = router;
