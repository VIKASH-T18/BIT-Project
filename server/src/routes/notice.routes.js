/**
 * @file notice.routes.js
 * @description Official Hostel Notices & Broadcast Announcements API routes.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { Notice } = require("../models/Support");

/**
 * GET /api/notices
 * Fetch all active notices with optional category filtering and search.
 */
router.get("/", authenticate, async (req, res) => {
  const { category, search, priority } = req.query;
  const filter = { isActive: true };

  if (category && category !== "all") {
    filter.category = category;
  }
  if (priority && priority !== "all") {
    filter.priority = priority;
  }
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
  }

  const notices = await Notice.find(filter)
    .populate("author", "name role avatar")
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(50);

  res.json({
    success: true,
    data: notices,
  });
});

/**
 * GET /api/notices/:id
 * Fetch single notice detail.
 */
router.get("/:id", authenticate, async (req, res) => {
  const notice = await Notice.findById(req.params.id).populate("author", "name role avatar");
  if (!notice) {
    return res.status(404).json({ success: false, message: "Notice not found." });
  }

  // Increment views
  notice.views = (notice.views || 0) + 1;
  await notice.save();

  res.json({ success: true, data: notice });
});

/**
 * POST /api/notices
 * Publish a new notice (Admin or Warden only).
 */
router.post("/", authenticate, authorize("admin", "warden"), async (req, res) => {
  const { title, content, category, priority, isPinned, targetAudience, attachment } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: "Title and content are required." });
  }

  const notice = await Notice.create({
    author: req.user._id,
    title,
    content,
    category: category || "general",
    priority: priority || "normal",
    isPinned: !!isPinned,
    targetAudience: targetAudience || "all",
    attachment,
  });

  const populated = await Notice.findById(notice._id).populate("author", "name role avatar");
  res.status(201).json({
    success: true,
    message: "Notice published successfully.",
    data: populated,
  });
});

/**
 * PATCH /api/notices/:id/pin
 * Toggle pinned status of a notice.
 */
router.patch("/:id/pin", authenticate, authorize("admin", "warden"), async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) return res.status(404).json({ success: false, message: "Notice not found." });

  notice.isPinned = !notice.isPinned;
  await notice.save();

  res.json({
    success: true,
    message: notice.isPinned ? "Notice pinned." : "Notice unpinned.",
    data: notice,
  });
});

/**
 * DELETE /api/notices/:id
 * Remove notice (Admin or Warden only).
 */
router.delete("/:id", authenticate, authorize("admin", "warden"), async (req, res) => {
  const notice = await Notice.findByIdAndDelete(req.params.id);
  if (!notice) return res.status(404).json({ success: false, message: "Notice not found." });

  res.json({ success: true, message: "Notice deleted successfully." });
});

/**
 * POST /api/notices/:id/like
 * Like or unlike a notice.
 */
router.post("/:id/like", authenticate, async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) return res.status(404).json({ success: false, message: "Notice not found." });

  const userId = req.user._id;
  const index = notice.likes.indexOf(userId);

  if (index === -1) {
    notice.likes.push(userId);
  } else {
    notice.likes.splice(index, 1);
  }

  await notice.save();
  res.json({ success: true, likesCount: notice.likes.length, isLiked: index === -1 });
});

module.exports = router;
