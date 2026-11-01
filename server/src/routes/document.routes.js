/**
 * @file document.routes.js
 * @description Document verification API routes.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { Document } = require("../models/Support");
require("../models/Student");
require("../models/User");

/** GET /api/documents — list documents pending verification */
router.get("/", authenticate, authorize("admin", "warden"), async (req, res) => {
  const { status = "all", page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};
  if (status && status !== "all") {
    filter.status = status;
  }

  const [documents, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    Document.find(filter)
      .populate({ path: "student", populate: { path: "user", select: "name email avatar profileUrl" } })
      .populate("verifiedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Document.countDocuments(),
    Document.countDocuments({ status: "pending" }),
    Document.countDocuments({ status: "approved" }),
    Document.countDocuments({ status: "rejected" }),
  ]);

  res.json({
    success: true,
    data: {
      documents,
      total,
      pendingCount,
      approvedCount,
      rejectedCount,
      page: parseInt(page),
    },
  });
});

/** PATCH /api/documents/:id/verify — approve or reject document */
router.patch("/:id/verify", authenticate, authorize("admin", "warden"), async (req, res) => {
  const { status, rejectionReason } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be approved or rejected." });
  }

  const doc = await Document.findByIdAndUpdate(
    req.params.id,
    {
      status,
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
      ...(status === "rejected" && { rejectionReason }),
    },
    { new: true }
  ).populate({ path: "student", populate: { path: "user", select: "name email" } });

  if (!doc) return res.status(404).json({ success: false, message: "Document not found." });
  res.json({ success: true, message: `Document ${status}.`, data: doc });
});

module.exports = router;
