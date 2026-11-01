/**
 * @file StudentDashboard.jsx
 * @description Spacious, modern student dashboard with stat cards, quick actions,
 * compatibility preview, allocation status, and recent activity.
 */

import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  Home, Star, AlertTriangle, Bell, Calendar,
  Users, ChevronRight, TrendingUp, Clock, CheckCircle, XCircle,
  Package, Award, ArrowRight, MessageSquare, Utensils, Shirt, QrCode, MapPin,
  Sparkles, CheckCircle2, ShieldCheck, ArrowUpRight, ShoppingBag
} from "lucide-react";

import { selectCurrentUser, selectUserProfile } from "../../redux/slices/authSlice";
import api from "../../services/api";
import SkeletonCard from "../../components/common/SkeletonCard";

const CountUpComponent = CountUp.default || CountUp;

// ─── Spacious Stat Card ───────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sublabel, color, link, animate = true }) => (
  <Link
    to={link}
    className="group relative overflow-hidden rounded-2xl p-6 sm:p-7 bg-light-surface dark:bg-dark-surface/90 border border-light-border dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:no-underline flex flex-col justify-between"
  >
    {/* Subtle gradient corner glow */}
    <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 blur-xl transition-opacity`} />

    <div className="flex items-start justify-between mb-4 relative z-10">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="w-8 h-8 rounded-full bg-light-elevated dark:bg-white/5 flex items-center justify-center text-light-muted dark:text-dark-muted group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-all">
        <ArrowUpRight size={16} />
      </div>
    </div>

    <div className="relative z-10 space-y-1">
      <p className="text-3xl font-black font-display tracking-tight text-light-text dark:text-dark-text">
        {animate && typeof value === "number" ? (
          <CountUpComponent end={value} duration={1.4} />
        ) : (
          value
        )}
      </p>
      <p className="text-sm font-semibold text-light-text dark:text-dark-text">{label}</p>
      {sublabel && (
        <p className="text-xs text-light-muted dark:text-dark-muted">{sublabel}</p>
      )}
    </div>
  </Link>
);

// ─── Spacious Quick Action Tile ───────────────────────────────────────────────
const QuickAction = ({ icon: Icon, label, desc, to, color }) => (
  <Link
    to={to}
    className="group relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-light-surface dark:bg-dark-surface/80 border border-light-border dark:border-white/10 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:no-underline flex flex-col justify-between min-h-[140px]"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={22} className="text-white" />
      </div>
      <ChevronRight size={16} className="text-light-muted/50 dark:text-dark-muted/50 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
    </div>

    <div>
      <h3 className="font-bold text-sm text-light-text dark:text-dark-text group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
        {label}
      </h3>
      <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5 line-clamp-1">
        {desc}
      </p>
    </div>
  </Link>
);

// ─── Compatibility Score Ring ─────────────────────────────────────────────────
const ScoreRing = ({ score }) => {
  const radius = 38;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color  = score >= 85 ? "#22c55e" : score >= 70 ? "#3b82f6" : score >= 50 ? "#eab308" : "#ef4444";

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-light-border dark:text-dark-border" />
        <circle
          cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
        <span className="text-2xl font-black font-display" style={{ color }}>{score}%</span>
        <span className="text-[10px] uppercase font-bold tracking-wider text-light-muted dark:text-dark-muted">Match</span>
      </div>
    </div>
  );
};

// ─── Student Dashboard Main ───────────────────────────────────────────────────
const StudentDashboard = () => {
  const user    = useSelector(selectCurrentUser);
  const profile = useSelector(selectUserProfile);
  const userId  = user?._id || user?.id;

  const { data: dashData, isLoading } = useQuery({
    queryKey:  ["student-dashboard", userId],
    queryFn:   async () => {
      const { data } = await api.get("/students/dashboard");
      return data.data;
    },
    enabled: !!userId,
    refetchInterval: 60000,
  });

  const { data: topMatch } = useQuery({
    queryKey: ["top-match", userId],
    queryFn:  async () => {
      const { data } = await api.get("/compatibility/recommendations?limit=1");
      return data.data?.[0];
    },
    enabled: !!userId && !!profile?.compatibilityProfile?.isComplete,
  });

  const greeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 18) return "Good afternoon";
    return "Good evening";
  };

  const getStatusBadge = (status) => {
    const map = {
      not_applied:  { label: "Not Applied",   cls: "badge-gray" },
      pending:      { label: "Pending",       cls: "badge-warning" },
      approved:     { label: "Approved",      cls: "badge-success" },
      rejected:     { label: "Rejected",      cls: "badge-error" },
      waitlisted:   { label: "Waitlisted",    cls: "badge-purple" },
      allocated:    { label: "Room Allocated",cls: "badge-success" },
      checked_in:   { label: "Checked In",    cls: "badge-info" },
    };
    return map[status] || { label: status, cls: "badge-gray" };
  };

  const hostelStatus = dashData?.hostelStatus || profile?.hostelStatus || "not_applied";
  const statusInfo   = getStatusBadge(hostelStatus);
  const completionPct = profile?.profileCompletion || 0;

  return (
    <div className="space-y-8">
      {/* ── Welcome Hero Banner ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 md:p-10 bg-gradient-to-br from-blue-900/90 via-indigo-950 to-slate-900 text-white border border-blue-500/20 shadow-xl"
      >
        {/* Glow ambient background rings */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 md:gap-8">
          <div className="flex items-center gap-5 sm:gap-6">
            <div className="relative shrink-0">
              <img
                src={user?.profileUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Student")}&background=2563eb&color=fff`}
                alt={user?.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-white/10 shadow-2xl"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center" title="Online">
                <span className="w-2 h-2 rounded-full bg-white" />
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Student Portal
                </span>
                <span className={`badge ${statusInfo.cls}`}>
                  {statusInfo.label}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-display tracking-tight text-white">
                {greeting()}, {user?.name?.split(" ")[0]} 👋
              </h1>

              <div className="flex items-center gap-3 text-sm text-slate-300 flex-wrap pt-0.5">
                {profile?.rollNumber && (
                  <span className="font-mono bg-white/10 px-2 py-0.5 rounded-md text-xs font-semibold">
                    {profile.rollNumber}
                  </span>
                )}
                {profile?.department && (
                  <span>{profile.department} • Year {profile.year || 1}</span>
                )}
                {dashData?.currentAllocation?.room && (
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1.5 text-xs">
                    <Home size={14} /> Room {dashData.currentAllocation.room.roomNumber} · {dashData.currentAllocation.block?.name || "Hostel"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Completion Bar */}
          <div className="w-full lg:w-64 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-inner">
            <div className="flex justify-between items-center text-xs font-bold mb-2">
              <span className="text-slate-300">Profile Completion</span>
              <span className="text-blue-400 font-mono text-sm">{completionPct}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-400"
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 1.2, delay: 0.2 }}
              />
            </div>
            {completionPct < 100 && (
              <Link to="/student/profile" className="text-xs text-blue-300 hover:text-white mt-2.5 flex items-center gap-1 font-semibold transition-colors">
                Complete your details <ChevronRight size={13} />
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── 4 Spacious Stat Cards ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} height="130px" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Home}
            label="Room Allocation"
            value={
              dashData?.currentAllocation?.room
                ? `Room ${dashData.currentAllocation.room.roomNumber}`
                : hostelStatus === "allocated"
                ? "Allocated"
                : "Not Allocated"
            }
            sublabel={dashData?.currentAllocation?.block?.name || "Click to view details"}
            color="from-blue-600 to-indigo-600"
            link="/student/allocation"
            animate={false}
          />
          <StatCard
            icon={Utensils}
            label="Mess Menu"
            value="Active"
            sublabel="Breakfast, Lunch & Dinner"
            color="from-amber-500 to-orange-600"
            link="/student/mess"
            animate={false}
          />
          <StatCard
            icon={AlertTriangle}
            label="Open Complaints"
            value={dashData?.openComplaints || 0}
            sublabel="Track maintenance status"
            color="from-rose-500 to-red-600"
            link="/student/complaints"
          />
          <StatCard
            icon={Calendar}
            label="Outing & Leave"
            value="Active Pass"
            sublabel="Track leaves & outing permissions"
            color="from-emerald-500 to-teal-600"
            link="/student/leave"
            animate={false}
          />
        </div>
      )}

      {/* ── Spacious Quick Actions Hub ─────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black font-display text-light-text dark:text-dark-text tracking-tight">
            Quick Actions & Services
          </h2>
          <span className="text-xs text-light-muted dark:text-dark-muted font-medium">
            Frequently used student tools
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {hostelStatus === "allocated" ? (
            <QuickAction
              icon={QrCode}
              label="My Room & QR"
              desc="View room & gate pass QR"
              to="/student/allocation"
              color="from-blue-500 to-indigo-600"
            />
          ) : (
            <QuickAction
              icon={Home}
              label="Apply Hostel"
              desc="Room allocation request"
              to="/student/application"
              color="from-blue-500 to-indigo-600"
            />
          )}
          <QuickAction
            icon={Utensils}
            label="Mess Menu"
            desc="Weekly meal timings"
            to="/student/mess"
            color="from-amber-500 to-orange-500"
          />
          <QuickAction
            icon={Star}
            label="AI Roommate"
            desc="Match compatibility quiz"
            to="/student/compatibility"
            color="from-purple-500 to-violet-600"
          />
          <QuickAction
            icon={Calendar}
            label="Leave Request"
            desc="Outing & night pass approval"
            to="/student/leave"
            color="from-pink-500 to-rose-500"
          />
          <QuickAction
            icon={Users}
            label="Visitor Pass"
            desc="Register parents / guests"
            to="/student/visitors"
            color="from-cyan-500 to-blue-600"
          />
          <QuickAction
            icon={AlertTriangle}
            label="Complaints"
            desc="Raise maintenance tickets"
            to="/student/complaints"
            color="from-red-500 to-rose-600"
          />
          <QuickAction
            icon={Shirt}
            label="Laundry Service"
            desc="Slot booking & tracker"
            to="/student/laundry"
            color="from-teal-500 to-emerald-600"
          />
          <QuickAction
            icon={ShoppingBag}
            label="Marketplace"
            desc="Buy & sell student essentials"
            to="/student/marketplace"
            color="from-emerald-500 to-green-600"
          />
        </div>
      </div>

      {/* ── Two-Column Bottom Grid: AI Roommate + Recent Activity ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Compatibility Highlight */}
        <div className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-500" />
                <h3 className="font-bold font-display text-light-text dark:text-dark-text text-base">
                  AI Roommate Match
                </h3>
              </div>
              <Link to="/student/compatibility" className="text-xs text-blue-500 hover:underline font-semibold">
                View all
              </Link>
            </div>

            {topMatch ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-white/5">
                  <ScoreRing score={topMatch.score} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-light-text dark:text-dark-text truncate text-base">
                      {topMatch.student?.user?.name}
                    </p>
                    <p className="text-xs text-light-muted dark:text-dark-muted">
                      {topMatch.student?.department} • Year {topMatch.student?.year}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {topMatch.matchReasons?.slice(0, 2).map((r, i) => (
                        <span key={i} className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8 px-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-3">
                  <Star size={28} />
                </div>
                <h4 className="font-bold text-sm text-light-text dark:text-dark-text">Find Compatible Roommates</h4>
                <p className="text-xs text-light-muted dark:text-dark-muted mt-1 max-w-xs">
                  Fill in your lifestyle habits (study hours, sleep schedule, neatness) to get AI recommendations.
                </p>
              </div>
            )}
          </div>

          <Link to="/student/compatibility" className="btn btn-primary btn-sm w-full mt-4">
            {topMatch ? "Browse Roommate Matches" : "Complete Lifestyle Quiz"} <ArrowRight size={14} />
          </Link>
        </div>

        {/* Recent Activity Timeline */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              <h3 className="font-bold font-display text-light-text dark:text-dark-text text-base">
                Recent Updates & Timeline
              </h3>
            </div>
            <Link to="/notifications" className="text-xs text-blue-500 hover:underline font-semibold flex items-center gap-1">
              All notifications <ChevronRight size={12} />
            </Link>
          </div>

          {dashData?.recentActivity?.length > 0 ? (
            <div className="space-y-3">
              {dashData.recentActivity.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-light-elevated dark:hover:bg-dark-elevated transition-colors border border-transparent hover:border-light-border dark:hover:border-white/5"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    a.type === "success" ? "bg-emerald-500/15 text-emerald-500" :
                    a.type === "warning" ? "bg-amber-500/15 text-amber-500" :
                    "bg-blue-500/15 text-blue-500"
                  }`}>
                    {a.type === "success" ? <CheckCircle size={18} /> :
                     a.type === "warning" ? <AlertTriangle size={18} /> :
                     <Bell size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-light-text dark:text-dark-text truncate">{a.message}</p>
                    <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state py-10">
              <Clock size={36} className="text-light-border dark:text-dark-border mb-2" />
              <p className="text-sm font-medium">All caught up! No recent activity.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
