/**
 * @file MessPage.jsx
 * @description Student-facing Mess Menu page.
 * Displays the current week's Breakfast, Lunch, and Dinner schedule
 * fetched live from the server (updated by Admin / Warden).
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coffee, Sun, Moon, Clock, Utensils, Calendar,
  RefreshCw, User2, AlertCircle, Star, Send, DollarSign,
  CheckCircle2, ChevronRight, Info
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const MEAL_CONFIG = [
  {
    key: "breakfast",
    label: "Breakfast",
    Icon: Coffee,
    gradient: "from-amber-500 to-orange-500",
    shadow: "shadow-amber-500/20",
    bgLight: "bg-amber-50 dark:bg-amber-900/10",
    borderColor: "border-amber-500/20",
    textColor: "text-amber-500",
    emoji: "🌅",
  },
  {
    key: "lunch",
    label: "Lunch",
    Icon: Sun,
    gradient: "from-emerald-500 to-teal-500",
    shadow: "shadow-emerald-500/20",
    bgLight: "bg-emerald-50 dark:bg-emerald-900/10",
    borderColor: "border-emerald-500/20",
    textColor: "text-emerald-500",
    emoji: "☀️",
  },
  {
    key: "dinner",
    label: "Dinner",
    Icon: Moon,
    gradient: "from-blue-500 to-indigo-600",
    shadow: "shadow-blue-500/20",
    bgLight: "bg-blue-50 dark:bg-blue-900/10",
    borderColor: "border-blue-500/20",
    textColor: "text-blue-500",
    emoji: "🌙",
  },
];

const MessPage = () => {
  const today = new Date();
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const currentDayName = DAYS[todayIndex];

  const [selectedDay, setSelectedDay] = useState(currentDayName);
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mess cut rebate form
  const [rebateFrom, setRebateFrom] = useState("");
  const [rebateTo, setRebateTo] = useState("");
  // Feedback
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/mess/menu");
      setMenuData(res.data.data);
    } catch (err) {
      setError("Could not load the mess menu. Please try again.");
      toast.error("Failed to load mess menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const dayMenu = menuData?.menu?.[selectedDay] || {};

  const handleApplyRebate = (e) => {
    e.preventDefault();
    if (!rebateFrom || !rebateTo) {
      toast.error("Please specify from and to dates for mess cut.");
      return;
    }
    const days = Math.max(1, Math.round((new Date(rebateTo) - new Date(rebateFrom)) / 864e5));
    const refund = days * 120;
    toast.success(`Mess cut applied for ${days} days! ₹${refund} will be credited to next month fees.`);
    setRebateFrom("");
    setRebateTo("");
  };

  const handleSendFeedback = (e) => {
    e.preventDefault();
    toast.success("Thank you! Feedback recorded for the Hostel Mess Committee.");
    setFeedbackComment("");
    setFeedbackRating(5);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg animate-pulse">
          <Utensils size={22} className="text-white" />
        </div>
        <p className="text-sm text-light-muted dark:text-dark-muted font-medium">Loading this week's menu…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={40} className="text-rose-400" />
        <p className="text-sm text-light-muted dark:text-dark-muted">{error}</p>
        <button onClick={fetchMenu} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
              🍽 Hostel Dining Hall
            </span>
            {menuData?.isDefault && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                Default Menu
              </span>
            )}
            {!menuData?.isDefault && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                <CheckCircle2 size={11} /> Updated by {menuData?.updatedByName}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-light-text dark:text-dark-text mt-1">
            Mess Menu
          </h1>
          <p className="text-sm text-light-muted dark:text-dark-muted mt-0.5">
            {menuData?.weekLabel
              ? `Week: ${menuData.weekLabel}`
              : "Weekly nutritionist-crafted meal schedule"}
          </p>
        </div>

        <button
          onClick={fetchMenu}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border hover:border-amber-500/40 text-light-muted dark:text-dark-muted hover:text-amber-500 transition-all self-start"
        >
          <RefreshCw size={13} />
          Refresh Menu
        </button>
      </div>

      {/* ── Week & Update Info ────────────────────────────────────────────── */}
      {menuData?.notes && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/8 border border-blue-500/20 text-sm text-blue-300">
          <Info size={16} className="mt-0.5 shrink-0 text-blue-400" />
          <span>{menuData.notes}</span>
        </div>
      )}

      {/* ── Day Selector ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-light-elevated/70 dark:bg-dark-elevated/70 border border-light-border dark:border-dark-border/60 overflow-x-auto">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedDay === day
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/25"
                : "text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text"
            }`}
          >
            {day === currentDayName && <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />}
            {day.slice(0, 3)}
            {day === currentDayName && <span className="text-[10px] opacity-75">Today</span>}
          </button>
        ))}
      </div>

      {/* ── Three Meal Cards: Breakfast, Lunch, Dinner ──────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDay}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {MEAL_CONFIG.map((meal, idx) => {
            const { Icon } = meal;
            const mealData = dayMenu[meal.key] || {};
            const hasData = mealData.items?.trim();
            return (
              <motion.div
                key={meal.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                className={`card p-6 flex flex-col gap-4 border ${meal.borderColor} hover:shadow-lg ${meal.shadow} transition-all duration-300 group relative overflow-hidden`}
              >
                {/* Background gradient blob */}
                <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${meal.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />

                {/* Meal header */}
                <div className="flex items-center justify-between relative">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${meal.gradient} flex items-center justify-center text-white shadow-md ${meal.shadow}`}>
                    <Icon size={20} />
                  </div>
                  {mealData.time && (
                    <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-light-muted dark:text-dark-muted bg-light-elevated dark:bg-dark-elevated px-2.5 py-1 rounded-lg border border-light-border dark:border-dark-border">
                      <Clock size={10} />
                      {mealData.time}
                    </div>
                  )}
                </div>

                {/* Meal name */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meal.emoji}</span>
                    <h3 className={`text-lg font-black font-display ${meal.textColor}`}>
                      {meal.label}
                    </h3>
                  </div>

                  {/* Items */}
                  {hasData ? (
                    <div className="mt-3 space-y-2">
                      {mealData.items.split(",").map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-light-muted dark:text-dark-muted">
                          <ChevronRight size={12} className={`shrink-0 mt-0.5 ${meal.textColor} opacity-60`} />
                          <span>{item.trim()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-light-muted/50 dark:text-dark-muted/40 italic">
                      Menu not yet updated for this day
                    </p>
                  )}
                </div>

                {/* Footer tag */}
                <div className={`mt-auto pt-3 border-t ${meal.borderColor} flex items-center gap-1.5 text-[10px] uppercase font-bold ${meal.textColor} opacity-70`}>
                  <CheckCircle2 size={11} />
                  Freshly Prepared On-Site
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* ── Full Week Quick-View Grid ─────────────────────────────────────── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-light-border dark:border-dark-border/60 pb-3">
          <Calendar size={16} className="text-amber-500" />
          <h2 className="text-sm font-bold font-display text-light-text dark:text-dark-text">
            Full Week Quick Overview
          </h2>
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
                const dm = menuData?.menu?.[day] || {};
                const isToday = day === currentDayName;
                return (
                  <tr
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`border-t border-light-border dark:border-dark-border/40 cursor-pointer transition-colors ${
                      isToday
                        ? "bg-amber-500/5"
                        : "hover:bg-light-elevated/50 dark:hover:bg-dark-elevated/50"
                    } ${selectedDay === day ? "bg-light-elevated dark:bg-dark-elevated" : ""}`}
                  >
                    <td className="py-2.5 pr-4">
                      <span className={`font-bold ${isToday ? "text-amber-500" : "text-light-text dark:text-dark-text"}`}>
                        {isToday ? "★ " : ""}{day.slice(0, 3)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-light-muted dark:text-dark-muted max-w-[180px]">
                      <span className="line-clamp-1">{dm.breakfast?.items?.split(",")[0]?.trim() || "—"}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-light-muted dark:text-dark-muted max-w-[180px]">
                      <span className="line-clamp-1">{dm.lunch?.items?.split(",")[0]?.trim() || "—"}</span>
                    </td>
                    <td className="py-2.5 text-light-muted dark:text-dark-muted max-w-[180px]">
                      <span className="line-clamp-1">{dm.dinner?.items?.split(",")[0]?.trim() || "—"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mess Cut Rebate & Feedback ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Mess Cut Rebate */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-light-border dark:border-dark-border/60 pb-3">
            <DollarSign size={18} className="text-amber-500" />
            <h2 className="text-base font-bold font-display text-light-text dark:text-dark-text">
              Apply for Mess Cut / Outpass Rebate
            </h2>
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted">
            Traveling home on approved leave for more than 2 consecutive days? Apply here to get daily ₹120 mess rebate credited to your dues.
          </p>
          <form onSubmit={handleApplyRebate} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-light-text dark:text-dark-text block mb-1">From Date</label>
                <input
                  type="date"
                  value={rebateFrom}
                  onChange={(e) => setRebateFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text"
                />
              </div>
              <div>
                <label className="font-bold text-light-text dark:text-dark-text block mb-1">To Date</label>
                <input
                  type="date"
                  value={rebateTo}
                  onChange={(e) => setRebateTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/30 transition-all"
            >
              Submit Mess Rebate Request
            </button>
          </form>
        </div>

        {/* Mess Quality Feedback */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-light-border dark:border-dark-border/60 pb-3">
            <Star size={18} className="text-amber-400 fill-amber-400" />
            <h2 className="text-base font-bold font-display text-light-text dark:text-dark-text">
              Mess Committee Feedback
            </h2>
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted">
            Rate today's dining experience. Ratings are reviewed weekly by student mess representatives and wardens.
          </p>
          <form onSubmit={handleSendFeedback} className="space-y-3.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-light-text dark:text-dark-text">Rate Food Quality:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFeedbackRating(s)}
                    className="hover:scale-125 transition-transform"
                  >
                    <Star
                      size={18}
                      className={s <= feedbackRating ? "text-amber-400 fill-amber-400" : "text-slate-600"}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-bold text-light-text dark:text-dark-text block mb-1">Suggestions / Comments</label>
              <textarea
                rows={2}
                placeholder="e.g. Please add more fruit options during breakfast..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Send size={13} />
              Submit Dining Feedback
            </button>
          </form>
        </div>
      </div>

      {/* ── Last Updated Info ─────────────────────────────────────────────── */}
      {menuData?.updatedAt && (
        <div className="flex items-center gap-2 text-xs text-light-muted dark:text-dark-muted px-1">
          <User2 size={13} />
          <span>
            Menu last updated by <strong>{menuData.updatedByName}</strong> on{" "}
            {new Date(menuData.updatedAt).toLocaleDateString("en-IN", {
              weekday: "long", day: "numeric", month: "long", year: "numeric"
            })}
          </span>
        </div>
      )}
    </div>
  );
};

export default MessPage;
