/**
 * @file application.routes.js
 * @description Hostel application API routes — submit, review, manage.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { body } = require("express-validator");
const { validateRequest } = require("../middleware/validate.middleware");
const {
  submitApplication,
  getMyApplication,
  getAllApplications,
  reviewApplication,
  cancelApplication,
  deleteApplication,
  bulkDeleteApplications,
  getApplicationStats,
} = require("../controllers/application.controller");

// ─── Validation ───────────────────────────────────────────────────────────────
const submitValidation = [
  body("preferredRoomType")
    .optional({ values: "falsy" })
    .isIn(["single", "double", "triple", "four_sharing"])
    .withMessage("Invalid room type"),
  body("preferredAC").optional({ values: "falsy" }).isBoolean(),
  body("preferredFloor").optional({ values: "falsy" }).isInt({ min: 0, max: 10 }),
];

const reviewValidation = [
  body("status")
    .isIn(["under_review", "approved", "rejected", "waitlisted"])
    .withMessage("Invalid status"),
];

// ─── Bulk & Management Routes (Admin / Warden) ────────────────────────────────
/** POST /api/applications/bulk-delete — delete multiple applications */
router.post("/bulk-delete", authenticate, authorize("admin", "warden"), bulkDeleteApplications);
router.delete("/bulk", authenticate, authorize("admin", "warden"), bulkDeleteApplications);

// ─── Student Routes (also accessible to admin/warden testing) ─────────────────

/** POST /api/applications — submit new application */
router.post("/", authenticate, authorize("student", "admin", "warden"), submitValidation, validateRequest, submitApplication);

/** GET /api/applications/my — get student's own applications */
router.get("/my", authenticate, authorize("student", "admin", "warden"), getMyApplication);

/** PATCH /api/applications/:id/cancel — student cancels application */
router.patch("/:id/cancel", authenticate, authorize("student"), cancelApplication);

/** DELETE /api/applications/:id — student, admin, or warden deletes application */
router.delete("/:id", authenticate, authorize("student", "admin", "warden"), deleteApplication);

// ─── Admin / Warden Routes ────────────────────────────────────────────────────

/** GET /api/applications/stats — aggregate counts by status */
router.get("/stats", authenticate, authorize("admin", "warden"), getApplicationStats);

/** GET /api/applications — list all applications */
router.get("/", authenticate, authorize("admin", "warden"), getAllApplications);

/** PATCH /api/applications/:id/review — approve / reject / waitlist */
router.patch("/:id/review", authenticate, authorize("admin", "warden"), reviewValidation, validateRequest, reviewApplication);

module.exports = router;
