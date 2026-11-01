/**
 * @file event.routes.js
 * @description Campus & Hostel Events API routes.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { Event } = require("../models/Extra");
const Student = require("../models/Student");

/**
 * GET /api/events
 * Fetch list of published hostel events.
 */
router.get("/", authenticate, async (req, res) => {
  const { type, timeframe } = req.query;
  const filter = {};

  if (type && type !== "all") {
    filter.type = type;
  }

  const now = new Date();
  if (timeframe === "upcoming") {
    filter.eventDate = { $gte: now };
  } else if (timeframe === "past") {
    filter.eventDate = { $lt: now };
  }

  const events = await Event.find(filter)
    .populate("organizer", "name role")
    .sort({ eventDate: 1 })
    .limit(50);

  res.json({
    success: true,
    data: events,
  });
});

/**
 * POST /api/events
 * Create new event (Admin or Warden).
 */
router.post("/", authenticate, authorize("admin", "warden"), async (req, res) => {
  const { title, description, type, eventDate, location, maxCapacity } = req.body;

  if (!title || !eventDate || !type) {
    return res.status(400).json({ success: false, message: "Title, event date, and type are required." });
  }

  const event = await Event.create({
    title,
    description,
    type,
    eventDate: new Date(eventDate),
    location: location || "Hostel Quadrangle",
    organizer: req.user._id,
    maxCapacity: maxCapacity ? parseInt(maxCapacity) : undefined,
    isPublished: true,
  });

  const populated = await Event.findById(event._id).populate("organizer", "name role");
  res.status(201).json({
    success: true,
    message: "Event scheduled successfully.",
    data: populated,
  });
});

/**
 * POST /api/events/:id/register
 * Student RSVP / Registration for an event.
 */
router.post("/:id/register", authenticate, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found." });

  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    return res.status(400).json({ success: false, message: "Only registered students can register for events." });
  }

  const alreadyRegistered = event.registrations.some(
    (r) => r.student.toString() === student._id.toString()
  );

  if (alreadyRegistered) {
    // Unregister
    event.registrations = event.registrations.filter(
      (r) => r.student.toString() !== student._id.toString()
    );
    await event.save();
    return res.json({ success: true, message: "Registration cancelled.", isRegistered: false });
  }

  if (event.maxCapacity && event.registrations.length >= event.maxCapacity) {
    return res.status(400).json({ success: false, message: "Event capacity full." });
  }

  event.registrations.push({
    student: student._id,
    registeredAt: new Date(),
  });
  await event.save();

  res.json({ success: true, message: "Registered for event successfully!", isRegistered: true });
});

/**
 * DELETE /api/events/:id
 * Delete event (Admin or Warden).
 */
router.delete("/:id", authenticate, authorize("admin", "warden"), async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found." });
  res.json({ success: true, message: "Event deleted successfully." });
});

module.exports = router;
