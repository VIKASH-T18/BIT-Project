/**
 * @file student.routes.js
 * @description Student profile and dashboard API routes.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  getStudentDashboard,
  getMyProfile,
  updateMyProfile,
  getAllStudents,
  getStudentById,
} = require("../controllers/student.controller");

// ─── Student Self Routes ──────────────────────────────────────────────────────

/** GET /api/students/dashboard */
router.get("/dashboard", authenticate, authorize("student"), getStudentDashboard);

/** GET /api/students/me — student's own full profile */
router.get("/me", authenticate, authorize("student"), getMyProfile);

/** PUT /api/students/me — update own profile */
router.put("/me", authenticate, authorize("student"), updateMyProfile);

// ─── Admin / Warden Routes ────────────────────────────────────────────────────

/** GET /api/students — list all students with filters */
router.get("/", authenticate, authorize("admin", "warden"), getAllStudents);

/** GET /api/students/:id — get single student */
router.get("/:id", authenticate, authorize("admin", "warden"), getStudentById);

module.exports = router;
