/**
 * @file mess.routes.js
 * @description Mess Menu API routes.
 *
 * GET  /api/mess/menu          — get the current week's active menu (all roles)
 * PUT  /api/mess/menu          — create/update this week's menu (admin & warden only)
 * GET  /api/mess/menu/history  — list past menus (admin & warden only)
 */

const router  = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const MessMenu = require("../models/MessMenu");
const logger   = require("../utils/logger");

// ─── Default seed menu (fallback when no DB record exists) ───────────────────

const DEFAULT_MENU = {
  Monday: {
    breakfast: { time: "07:30 - 09:00", items: "Ghee Pongal, Medu Vada, Coconut Chutney, Sambar, Tea / Coffee" },
    lunch:     { time: "12:15 - 14:00", items: "Steamed Rice, Kootu, Poriyal, Rasam, Curd, Appalam. Non-Veg: Chettinad Chicken Gravy" },
    dinner:    { time: "19:30 - 21:00", items: "Soft Chapati, Paneer Butter Masala, Dal Tadka, Jeera Rice, Fresh Banana" },
  },
  Tuesday: {
    breakfast: { time: "07:30 - 09:00", items: "Idli & Vada, Tomato Thokku, Pudina Chutney, Steaming Sambar, Hot Milk / Boost" },
    lunch:     { time: "12:15 - 14:00", items: "Variety Rice (Lemon & Curd Rice), Potato Fry, Kathamba Sambar, Mor Milagai" },
    dinner:    { time: "19:30 - 21:00", items: "Poori with Potato Masala, Peas Pulao, Onion Raitha, Gulab Jamun" },
  },
  Wednesday: {
    breakfast: { time: "07:30 - 09:00", items: "Rava Upma / Kichadi, Coconut Chutney, Sambar, Boiled Egg, Coffee / Tea" },
    lunch:     { time: "12:15 - 14:00", items: "Special Feast: Biryani Rice, Brinjal Curry, Onion Raitha, Pepper Chicken / Mushroom Masala" },
    dinner:    { time: "19:30 - 21:00", items: "Dosa with Coriander Chutney, Sambar, White Rice, Buttermilk" },
  },
  Thursday: {
    breakfast: { time: "07:30 - 09:00", items: "Semiya Upma, Coconut Chutney, Idli, Podi, Hot Sambar, Tea / Coffee" },
    lunch:     { time: "12:15 - 14:00", items: "Steamed Rice, Murungakkai Sambar, Vendakkai Mandi, Rasam, Curd" },
    dinner:    { time: "19:30 - 21:00", items: "Malabar Parotta, Veg Kurma, Dal Makhani, Steamed Rice, Banana" },
  },
  Friday: {
    breakfast: { time: "07:30 - 09:00", items: "Puri & Potato Chana Masala, Kesari Sweet, Tea / Coffee" },
    lunch:     { time: "12:15 - 14:00", items: "Full South Indian Meals: Sambar, Vatha Kuzhambu, Avial, Payasam, Appalam" },
    dinner:    { time: "19:30 - 21:00", items: "Fried Rice / Noodles, Manchurian Gravy, Mixed Veg Salad, Ice Cream" },
  },
  Saturday: {
    breakfast: { time: "07:30 - 09:00", items: "Aloo Paratha, Curd & Pickle, Fresh Fruit, Tea / Coffee" },
    lunch:     { time: "12:15 - 14:00", items: "Tomato Rice, Boondi Raitha, Potato Chips, White Rice, Curd" },
    dinner:    { time: "19:30 - 21:00", items: "Uttapam with 2 Chutneys, Sambar, Curd Rice" },
  },
  Sunday: {
    breakfast: { time: "07:30 - 09:30", items: "Special Dosa, Idli, Medu Vada, 3 Chutneys, Tiffin Sambar, Tea / Coffee" },
    lunch:     { time: "12:15 - 14:30", items: "Grand Sunday Feast: Chicken Dum Biryani / Paneer Biryani, Raitha, Egg, Sweet" },
    dinner:    { time: "19:30 - 21:00", items: "Light Dinner: Idiyappam / Chapati, Kurma, Warm Milk with Turmeric" },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the Monday (start of week) for a given date as UTC midnight Date. */
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Format a date range label like "Oct 21 – Oct 27, 2026" */
function weekLabel(startDate) {
  const end = new Date(startDate);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = (d) =>
    d.toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt(startDate)} – ${fmt(end)}, ${end.getUTCFullYear()}`;
}

// ─── GET /api/mess/menu  (public to all authenticated users) ──────────────────

router.get("/menu", authenticate, async (req, res) => {
  try {
    // Find the most recent active menu
    let record = await MessMenu.findOne({ isActive: true })
      .sort({ weekStartDate: -1 })
      .lean();

    if (!record) {
      // No menu in DB yet — return the default static menu
      const weekStart = getWeekStart();
      return res.json({
        success: true,
        data: {
          menu: DEFAULT_MENU,
          weekLabel: weekLabel(weekStart),
          weekStartDate: weekStart,
          updatedByName: "System (Default)",
          updatedAt: null,
          notes: "",
          isDefault: true,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        menu: record.menu,
        weekLabel: record.weekLabel,
        weekStartDate: record.weekStartDate,
        updatedByName: record.updatedByName,
        updatedAt: record.updatedAt,
        notes: record.notes,
        isDefault: false,
      },
    });
  } catch (err) {
    logger.error(`GET /mess/menu error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/mess/menu  (admin & warden only) ────────────────────────────────

router.put("/menu", authenticate, authorize("admin", "warden"), async (req, res) => {
  try {
    const { menu, notes, weekStartDate: clientWeekStart } = req.body;

    if (!menu) {
      return res.status(400).json({ success: false, message: "menu object is required" });
    }

    const weekStart = clientWeekStart
      ? new Date(clientWeekStart)
      : getWeekStart();

    const label = weekLabel(weekStart);

    // Deactivate any old records
    await MessMenu.updateMany({ isActive: true }, { isActive: false });

    const updaterName = req.user?.name || req.user?.email || "Admin";

    const record = await MessMenu.findOneAndUpdate(
      { weekStartDate: weekStart },
      {
        weekStartDate: weekStart,
        weekLabel: label,
        menu,
        updatedBy: req.user?._id,
        updatedByName: updaterName,
        notes: notes || "",
        isActive: true,
      },
      { upsert: true, new: true, runValidators: true }
    );

    logger.info(`Mess menu updated for week ${label} by ${updaterName}`);

    return res.json({
      success: true,
      message: `Weekly mess menu updated for ${label}`,
      data: record,
    });
  } catch (err) {
    logger.error(`PUT /mess/menu error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/mess/menu/history  (admin & warden only) ───────────────────────

router.get("/menu/history", authenticate, authorize("admin", "warden"), async (req, res) => {
  try {
    const records = await MessMenu.find({})
      .sort({ weekStartDate: -1 })
      .limit(12)
      .select("weekLabel weekStartDate updatedByName updatedAt isActive notes")
      .lean();

    return res.json({ success: true, data: records });
  } catch (err) {
    logger.error(`GET /mess/menu/history error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
