/**
 * @file MessMenuPage.jsx
 * @description Admin / Warden mess menu management page.
 * Lets admin/warden update the full weekly mess menu (Mon–Sun) with
 * Breakfast, Lunch, and Dinner for each day. Menu can be updated once per week.
 * Students will see this updated menu live on their Mess Menu page.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Utensils, Coffee, Sun, Moon, Clock, Save, RefreshCw, History,
  CheckCircle2, AlertCircle, Calendar, User2, Edit3, Info,
  ChevronDown, ChevronUp, Sparkles, Eye
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const MEAL_CONFIG = [
  { key: "breakfast", label: "Breakfast", Icon: Coffee, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", gradient: "from-amber-500 to-orange-500", emoji: "🌅" },
  { key: "lunch",     label: "Lunch",     Icon: Sun,    color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", gradient: "from-emerald-500 to-teal-500", emoji: "☀️" },
  { key: "dinner",    label: "Dinner",    Icon: Moon,   color: "text-blue-500",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    gradient: "from-blue-500 to-indigo-600", emoji: "🌙" },
];

const DEFAULT_DAY_MENU = {
  breakfast: { time: "07:30 - 09:00", items: "" },
  lunch:     { time: "12:15 - 14:00", items: "" },
  dinner:    { time: "19:30 - 21:00", items: "" },
};

const buildEmptyMenu = () =>
  DAYS.reduce((acc, day) => {
    acc[day] = JSON.parse(JSON.stringify(DEFAULT_DAY_MENU));
    return acc;
  }, {});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_TIMES = {
  breakfast: "07:30 - 09:00",
  lunch:     "12:15 - 14:00",
  dinner:    "19:30 - 21:00",
};

// ─── Component ────────────────────────────────────────────────────────────────

const MessMenuPage = () => {
  const [menu, setMenu]           = useState(buildEmptyMenu());
  const [notes, setNotes]         = useState("");
  const [weekLabel, setWeekLabel] = useState("");
  const [updatedBy, setUpdatedBy] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [isDefault, setIsDefault] = useState(true);

  const [activeDay, setActiveDay]     = useState("Monday");
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory]         = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null); // for mobile accordion

  // Today's day name
  const today = new Date();
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const currentDayName = DAYS[todayIndex];

  // ── Fetch current menu ─────────────────────────────────────────────────────
  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/mess/menu");
      const data = res.data.data;
      // Merge fetched menu into our state (fill missing meals with defaults)
      const merged = buildEmptyMenu();
      for (const day of DAYS) {
        for (const meal of MEAL_CONFIG) {
          merged[day][meal.key] = {
            time:  data.menu?.[day]?.[meal.key]?.time  || DEFAULT_TIMES[meal.key],
            items: data.menu?.[day]?.[meal.key]?.items || "",
          };
        }
      }
      setMenu(merged);
      setNotes(data.notes || "");
      setWeekLabel(data.weekLabel || "");
      setUpdatedBy(data.updatedByName || "");
      setUpdatedAt(data.updatedAt || null);
      setIsDefault(data.isDefault ?? true);
    } catch {
      toast.error("Failed to load current mess menu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // ── Fetch history ─────────────────────────────────────────────────────────
  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get("/mess/menu/history");
      setHistory(res.data.data || []);
    } catch {
      toast.error("Failed to load menu history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && history.length === 0) fetchHistory();
  };

  // ── Form helpers ──────────────────────────────────────────────────────────
  const updateMealField = (day, meal, field, value) => {
    setMenu((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [meal]: {
          ...prev[day][meal],
          [field]: value,
        },
      },
    }));
  };

  // ── Save / Submit ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    // Validate at least one day has breakfast items
    const hasContent = DAYS.some((d) =>
      MEAL_CONFIG.some((m) => menu[d]?.[m.key]?.items?.trim())
    );
    if (!hasContent) {
      toast.error("Please fill in at least one meal item before saving.");
      return;
    }

    try {
      setSaving(true);
      await api.put("/mess/menu", { menu, notes });
      toast.success("✅ Mess menu updated successfully! Students can see the new menu now.");
      fetchMenu();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save menu. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg animate-pulse">
          <Utensils size={22} className="text-white" />
        </div>
        <p className="text-sm text-light-muted dark:text-dark-muted">Loading mess menu…</p>
      </div>
    );
  }

  const dayMenu = menu[activeDay] || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
              🍽 Mess Management
            </span>
            {!isDefault ? (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                <CheckCircle2 size={11} /> Live Menu Active
              </span>
            ) : (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium">
                Using Default Menu
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-light-text dark:text-dark-text mt-1">
            Mess Menu
          </h1>
          <p className="text-sm text-light-muted dark:text-dark-muted mt-0.5">
            Update the weekly mess menu. Students will see Breakfast, Lunch, and Dinner for each day.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start flex-wrap">
          <button
            onClick={fetchMenu}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border hover:border-primary-500/40 text-light-muted dark:text-dark-muted hover:text-primary-500 transition-all"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={toggleHistory}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border hover:border-violet-500/40 text-light-muted dark:text-dark-muted hover:text-violet-400 transition-all"
          >
            <History size={13} />
            {showHistory ? "Hide History" : "View History"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-md shadow-amber-600/30 transition-all disabled:opacity-60"
          >
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? "Saving…" : "Save Menu"}
          </button>
        </div>
      </div>

      {/* ── Status Card ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Calendar size={16} className="text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] text-light-muted dark:text-dark-muted font-medium uppercase tracking-wide">Current Week</p>
            <p className="text-sm font-bold text-light-text dark:text-dark-text">{weekLabel || "Not set"}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <User2 size={16} className="text-blue-500" />
          </div>
          <div>
            <p className="text-[11px] text-light-muted dark:text-dark-muted font-medium uppercase tracking-wide">Last Updated By</p>
            <p className="text-sm font-bold text-light-text dark:text-dark-text">{updatedBy || "—"}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Clock size={16} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-[11px] text-light-muted dark:text-dark-muted font-medium uppercase tracking-wide">Last Updated At</p>
            <p className="text-sm font-bold text-light-text dark:text-dark-text">
              {updatedAt
                ? new Date(updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : "Never"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Info Banner ─────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/8 border border-blue-500/20 text-sm text-blue-300">
        <Info size={16} className="mt-0.5 shrink-0 text-blue-400" />
        <span className="text-xs">
          Fill in the Breakfast, Lunch, and Dinner items for each day. Use commas to separate food items (e.g. <em>Idli, Sambar, Coconut Chutney, Tea</em>). Students will see this menu updated live on their Mess Menu page.
        </span>
      </div>

      {/* ── Day Tabs + Editor ────────────────────────────────────────────── */}
      <div className="card p-0 overflow-hidden">
        {/* Day selector tabs */}
        <div className="flex overflow-x-auto border-b border-light-border dark:border-dark-border bg-light-elevated/50 dark:bg-dark-elevated/50">
          {DAYS.map((day) => {
            const hasContent = MEAL_CONFIG.some((m) => menu[day]?.[m.key]?.items?.trim());
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`relative px-4 py-3 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border-b-2 ${
                  activeDay === day
                    ? "border-amber-500 text-amber-500 bg-amber-500/5"
                    : "border-transparent text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text"
                }`}
              >
                {day === currentDayName && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
                {day.slice(0, 3)}
                {hasContent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Day label */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-2">
          <h2 className="text-lg font-black font-display text-light-text dark:text-dark-text">
            {activeDay}
          </h2>
          {activeDay === currentDayName && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Today
            </span>
          )}
        </div>

        {/* Three meal editors */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDay}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
            className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5"
          >
            {MEAL_CONFIG.map((meal) => {
              const { Icon } = meal;
              const mealData = dayMenu[meal.key] || { time: DEFAULT_TIMES[meal.key], items: "" };
              return (
                <div
                  key={meal.key}
                  className={`rounded-2xl border ${meal.border} ${meal.bg} p-5 space-y-3`}
                >
                  {/* Meal header */}
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meal.gradient} flex items-center justify-center text-white shadow-md`}>
                      <Icon size={17} />
                    </div>
                    <div>
                      <p className={`text-sm font-black font-display ${meal.color}`}>
                        {meal.emoji} {meal.label}
                      </p>
                    </div>
                  </div>

                  {/* Time input */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wide text-light-muted dark:text-dark-muted block mb-1">
                      <Clock size={10} className="inline mr-1" />
                      Serving Time
                    </label>
                    <input
                      type="text"
                      placeholder={DEFAULT_TIMES[meal.key]}
                      value={mealData.time}
                      onChange={(e) => updateMealField(activeDay, meal.key, "time", e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text dark:text-dark-text placeholder:text-light-muted/50 dark:placeholder:text-dark-muted/50 font-mono"
                    />
                  </div>

                  {/* Items input */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wide text-light-muted dark:text-dark-muted block mb-1">
                      <Utensils size={10} className="inline mr-1" />
                      Menu Items (comma-separated)
                    </label>
                    <textarea
                      rows={4}
                      placeholder={`e.g. Idli, Vada, Sambar, Coconut Chutney, Tea / Coffee`}
                      value={mealData.items}
                      onChange={(e) => updateMealField(activeDay, meal.key, "items", e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text dark:text-dark-text placeholder:text-light-muted/40 dark:placeholder:text-dark-muted/40 resize-none leading-relaxed"
                    />
                    {/* Item count preview */}
                    {mealData.items?.trim() && (
                      <p className={`mt-1.5 text-[10px] ${meal.color} font-semibold`}>
                        {mealData.items.split(",").filter(i => i.trim()).length} items
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── All Days at a Glance ─────────────────────────────────────────── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-light-border dark:border-dark-border/60 pb-3">
          <Eye size={16} className="text-primary-500" />
          <h2 className="text-sm font-bold font-display text-light-text dark:text-dark-text">
            All Days Preview (Student View)
          </h2>
          <span className="ml-auto text-[11px] text-light-muted dark:text-dark-muted">
            Click a day to edit
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-light-muted dark:text-dark-muted">
                <th className="text-left py-2 pr-4 font-bold w-24">Day</th>
                <th className="text-left py-2 pr-4 font-bold text-amber-500">🌅 Breakfast</th>
                <th className="text-left py-2 pr-4 font-bold text-emerald-500">☀️ Lunch</th>
                <th className="text-left py-2 font-bold text-blue-500">🌙 Dinner</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => {
                const dm = menu[day] || {};
                const isToday = day === currentDayName;
                const isActive = day === activeDay;
                return (
                  <tr
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`border-t border-light-border dark:border-dark-border/40 cursor-pointer transition-colors ${
                      isActive
                        ? "bg-amber-500/5 border-amber-500/20"
                        : "hover:bg-light-elevated/50 dark:hover:bg-dark-elevated/50"
                    }`}
                  >
                    <td className="py-2.5 pr-4">
                      <span className={`font-bold ${isToday ? "text-emerald-500" : isActive ? "text-amber-500" : "text-light-text dark:text-dark-text"}`}>
                        {isToday ? "● " : ""}{day.slice(0, 3)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-light-muted dark:text-dark-muted max-w-[180px]">
                      <span className={`line-clamp-1 ${!dm.breakfast?.items?.trim() ? "opacity-30 italic" : ""}`}>
                        {dm.breakfast?.items?.split(",")[0]?.trim() || "Empty"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-light-muted dark:text-dark-muted max-w-[180px]">
                      <span className={`line-clamp-1 ${!dm.lunch?.items?.trim() ? "opacity-30 italic" : ""}`}>
                        {dm.lunch?.items?.split(",")[0]?.trim() || "Empty"}
                      </span>
                    </td>
                    <td className="py-2.5 text-light-muted dark:text-dark-muted max-w-[180px]">
                      <span className={`line-clamp-1 ${!dm.dinner?.items?.trim() ? "opacity-30 italic" : ""}`}>
                        {dm.dinner?.items?.split(",")[0]?.trim() || "Empty"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Week Notes ──────────────────────────────────────────────────── */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-violet-400" />
          <h2 className="text-sm font-bold font-display text-light-text dark:text-dark-text">
            Week Notes / Announcement
          </h2>
          <span className="text-[11px] text-light-muted dark:text-dark-muted ml-1">(optional — shown as info banner to students)</span>
        </div>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Special feast on Wednesday! Extra sweets on Sunday. No non-veg on Friday."
          className="w-full px-4 py-2.5 text-sm rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border text-light-text dark:text-dark-text placeholder:text-light-muted/40 dark:placeholder:text-dark-muted/40 resize-none"
        />
      </div>

      {/* ── Save Button (bottom) ─────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-600/30 transition-all disabled:opacity-60"
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Publishing Menu…" : "Publish Weekly Mess Menu"}
        </button>
      </div>

      {/* ── History Panel ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card overflow-hidden"
          >
            <div className="p-5 border-b border-light-border dark:border-dark-border flex items-center gap-2">
              <History size={16} className="text-violet-400" />
              <h2 className="text-sm font-bold font-display text-light-text dark:text-dark-text">
                Menu Update History
              </h2>
            </div>
            {historyLoading ? (
              <div className="p-8 text-center text-light-muted dark:text-dark-muted text-sm">
                Loading history…
              </div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-light-muted dark:text-dark-muted text-sm">
                No history yet. Publish your first menu!
              </div>
            ) : (
              <div className="divide-y divide-light-border dark:divide-dark-border">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3 text-xs hover:bg-light-elevated/50 dark:hover:bg-dark-elevated/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${h.isActive ? "bg-emerald-400" : "bg-slate-500"}`} />
                    <span className="font-bold text-light-text dark:text-dark-text w-40 shrink-0">{h.weekLabel}</span>
                    <span className="text-light-muted dark:text-dark-muted">by <strong>{h.updatedByName}</strong></span>
                    <span className="ml-auto text-light-muted dark:text-dark-muted">
                      {h.updatedAt ? new Date(h.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </span>
                    {h.isActive && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessMenuPage;
