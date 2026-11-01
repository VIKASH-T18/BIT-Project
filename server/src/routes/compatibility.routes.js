/**
 * @file compatibility.routes.js
 * @description Roommate compatibility API routes.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { body } = require("express-validator");
const { validateRequest } = require("../middleware/validate.middleware");
const {
  getMyProfile,
  upsertProfile,
  getRecommendations,
  computeCompatibility,
  getCompatibilityResult,
  getAllProfiles,
} = require("../controllers/compatibility.controller");

// ─── Student Routes ───────────────────────────────────────────────────────────

/** GET /api/compatibility/profile — get own profile */
router.get("/profile", authenticate, getMyProfile);

/** POST /api/compatibility/profile — create or update profile */
router.post("/profile", authenticate, upsertProfile);

/** GET /api/compatibility/recommendations — get top roommate matches */
router.get("/recommendations", authenticate, authorize("student"), getRecommendations);

/** POST /api/compatibility/compute — compute score between self and another student */
router.post(
  "/compute",
  authenticate,
  authorize("student"),
  [body("targetStudentId").notEmpty().withMessage("targetStudentId required")],
  validateRequest,
  computeCompatibility
);

/** GET /api/compatibility/result/:targetStudentId — get saved result */
router.get("/result/:targetStudentId", authenticate, authorize("student"), getCompatibilityResult);

// ─── Admin / Warden Routes ────────────────────────────────────────────────────

/** GET /api/compatibility/all-profiles — admin view of all complete profiles */
router.get("/all-profiles", authenticate, authorize("admin", "warden"), getAllProfiles);

module.exports = router;
