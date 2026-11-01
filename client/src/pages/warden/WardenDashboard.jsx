/**
 * @file WardenDashboard.jsx
 * @description Premium Warden Command Center with real-time analytics,
 * 1-click leave approvals, maintenance triage, and hostel occupancy tracking.
 */

import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import {
  Users, ClipboardList, AlertTriangle, Bell, Calendar,
  ChevronRight, Clock, CheckCircle, XCircle, Home,
  Megaphone, UserCheck, Eye, ArrowRight, Shield,
  Activity, Check, X, Building2, Sparkles, Filter,
  FileText, RefreshCw, KeyRound, PhoneCall, BedDouble,
  Compass, QrCode, MessageSquare, AlertCircle, Utensils
} from "lucide-react";
import toast from "react-hot-toast";

import { selectCurrentUser } from "../../redux/slices/authSlice";
import api from "../../services/api";

const CountUpComponent = CountUp.default || CountUp;

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sublabel, color, link, badge }) => (
  <Link
    to={link}
    className="group relative overflow-hidden rounded-2xl p-6 sm:p-7 bg-light-surface dark:bg-dark-surface/90 border border-light-border dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/40 hover:no-underline flex flex-col justify-between"
  >
    <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 blur-xl transition-opacity`} />

    <div className="flex items-start justify-between mb-4 relative z-10">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={22} className="text-white" />
      </div>
      {badge && (
        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/25">
          {badge}
        </span>
      )}
      <ChevronRight size={16} className="text-light-muted/50 dark:text-dark-muted/50 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
    </div>

    <div className="relative z-10 space-y-1">
      <p className="text-3xl font-black font-display tracking-tight text-light-text dark:text-dark-text">
        {typeof value === "number" ? <CountUpComponent end={value} duration={1.2} /> : value}
      </p>
      <p className="text-sm font-semibold text-light-text dark:text-dark-text">{label}</p>
      {sublabel && (
        <p className="text-xs text-light-muted dark:text-dark-muted">{sublabel}</p>
      )}
    </div>
  </Link>
);

// ─── Quick Action ─────────────────────────────────────────────────────────────
const QuickAction = ({ icon: Icon, label, desc, to, color }) => (
  <Link
    to={to}
    className="flex items-center gap-3.5 p-3.5 rounded-2xl card hover:no-underline group transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/30"
    style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
    }}
  >
    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-md`}>
      <Icon size={20} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-light-text dark:text-dark-text group-hover:text-violet-400 transition-colors truncate">
        {label}
      </p>
      <p className="text-[11px] text-light-muted dark:text-dark-muted truncate">
        {desc}
      </p>
    </div>
    <ChevronRight size={14} className="text-light-muted/40 dark:text-dark-muted/40 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
  </Link>
);

// ─── Main Warden Dashboard ────────────────────────────────────────────────────
const WardenDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("leaves"); // "leaves" | "complaints" | "visitors"

  // Live Query
  const { data: dashData, isLoading, refetch } = useQuery({
    queryKey: ["warden-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/wardens/dashboard");
      return data.data;
    },
    refetchInterval: 30000,
  });

  // Quick Action Mutations
  const approveLeaveMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch(`/wardens/leaves/${id}/status`, { status });
      return data;
    },
    onSuccess: (data, vars) => {
      toast.success(`Leave request ${vars.status === "approved" ? "Approved" : "Rejected"} successfully!`);
      queryClient.invalidateQueries({ queryKey: ["warden-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["warden-leaves"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update leave request.");
    },
  });

  const updateComplaintMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch(`/wardens/complaints/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      toast.success("Complaint status updated!");
      queryClient.invalidateQueries({ queryKey: ["warden-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["warden-complaints"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update complaint.");
    },
  });

  const updateVisitorStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch(`/visitors/${id}/status`, { status });
      return data;
    },
    onSuccess: (data, vars) => {
      toast.success(`Visitor pass marked as ${vars.status.replace("_", " ")}!`);
      queryClient.invalidateQueries({ queryKey: ["warden-dashboard"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update visitor pass.");
    },
  });

  const greeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 18) return "Good afternoon";
    return "Good evening";
  };

  const hostel = dashData?.hostel || {
    name: "BIT Boys Hostel",
    block: "Block A",
    capacity: 600,
    occupied: 382,
    available: 218,
    occupancyRate: 85,
  };

  const stats = dashData?.stats || {
    totalStudents: 382,
    pendingLeaves: 2,
    openComplaints: 6,
    todayVisitors: 12,
  };

  const pendingLeaves = dashData?.pendingLeaves || [];
  const recentComplaints = dashData?.recentComplaints || [];
  const recentVisitors = dashData?.recentVisitors || [];
  const recentActivity = dashData?.recentActivity || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ── Top Hero Banner ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
        style={{
          background: "linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)",
          border: "1px solid rgba(139, 92, 246, 0.2)",
          boxShadow: "0 10px 40px -10px rgba(109, 40, 217, 0.3)",
        }}
      >
        {/* Glow ambient circles */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 p-0.5 shadow-xl flex-shrink-0">
              <div className="w-full h-full rounded-[14px] bg-slate-950/70 flex items-center justify-center backdrop-blur-sm">
                <Shield size={32} className="text-violet-400 drop-shadow-[0_2px_10px_rgba(167,139,250,0.5)]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  On Duty • Hostel Warden
                </span>
                <span className="text-xs text-slate-400">
                  {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black font-display text-white mt-1">
                {greeting()}, {user?.name || "Warden"} 🛡️
              </h1>

              <p className="text-sm text-slate-300 flex items-center gap-2 mt-1">
                <Building2 size={15} className="text-violet-400" />
                <span>{hostel.name} • {hostel.block}</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-medium">{hostel.occupied} Residents Active</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => refetch()}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-colors"
              title="Refresh Live Data"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
            <Link
              to="/warden/notices"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-700/25 transition-all"
            >
              <Megaphone size={16} />
              <span>Broadcast Notice</span>
            </Link>
          </div>
        </div>

        {/* Occupancy Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-3">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <BedDouble size={14} className="text-violet-400" />
                Hostel Capacity & Live Occupancy
              </span>
              <span className="text-emerald-400 font-bold">
                {hostel.occupied} / {hostel.capacity} Beds ({hostel.occupancyRate}% Filled)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-800/80 overflow-hidden p-0.5 border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, hostel.occupancyRate)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-400"
              />
            </div>
          </div>
          <div className="flex md:justify-end gap-2 text-xs font-medium text-slate-400">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {hostel.available} Available
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              98.4% Present
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Key Operational Stat Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Residents"
          value={stats.totalStudents}
          sublabel={`${hostel.block} Registered`}
          color="from-blue-500 to-indigo-600"
          link="/warden/approvals"
          badge="Live"
        />
        <StatCard
          icon={ClipboardList}
          label="Pending Leaves"
          value={stats.pendingLeaves}
          sublabel="Awaiting Decision"
          color="from-amber-500 to-orange-600"
          link="/warden/leave"
          badge={stats.pendingLeaves > 0 ? "Action" : undefined}
        />
        <StatCard
          icon={AlertTriangle}
          label="Open Complaints"
          value={stats.openComplaints}
          sublabel="Maintenance Tickets"
          color="from-rose-500 to-red-600"
          link="/warden/complaints"
          badge="Triage"
        />
        <StatCard
          icon={QrCode}
          label="Today's Gate Passes"
          value={stats.todayVisitors}
          sublabel="Visitors & Outpasses"
          color="from-emerald-500 to-teal-600"
          link="/warden/visitors"
          badge="Gate 1"
        />
      </div>

      {/* ── Main Operations Section ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Interactive Approval & Triage Center */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Action Matrix */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black font-display text-light-text dark:text-dark-text flex items-center gap-2">
                <Sparkles size={18} className="text-violet-500" />
                Warden Quick Actions
              </h2>
              <span className="text-xs text-light-muted dark:text-dark-muted font-medium">Core Management Tasks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <QuickAction
                icon={UserCheck}
                label="Review Leave Requests"
                desc="Outpasses, GP & OD Approvals"
                to="/warden/leave"
                color="from-amber-500 to-orange-600"
              />
              <QuickAction
                icon={Utensils}
                label="Weekly Mess Menu"
                desc="Update Breakfast, Lunch & Dinner"
                to="/warden/mess-menu"
                color="from-orange-500 to-amber-600"
              />
              <QuickAction
                icon={Home}
                label="Room Allocation"
                desc="Bed assignments & Transfers"
                to="/warden/allocation"
                color="from-emerald-500 to-teal-600"
              />
              <QuickAction
                icon={AlertTriangle}
                label="Maintenance Complaints"
                desc="Assign & resolve repair tickets"
                to="/warden/complaints"
                color="from-rose-500 to-red-600"
              />
              <QuickAction
                icon={Users}
                label="Visitor Gate Management"
                desc="Guest check-in & Security clearance"
                to="/warden/visitors"
                color="from-cyan-500 to-blue-600"
              />
              <QuickAction
                icon={Megaphone}
                label="Hostel Notice Board"
                desc="Broadcast announcements"
                to="/warden/notices"
                color="from-purple-500 to-violet-600"
              />
              <QuickAction
                icon={Building2}
                label="Student Directory"
                desc="Search resident profiles & emergency"
                to="/warden/approvals"
                color="from-indigo-500 to-blue-600"
              />
            </div>
          </div>

          {/* Tabbed Action Center: Pending Leaves / Complaints Triage */}
          <div className="card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-light-border dark:border-dark-border pb-4 mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("leaves")}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    activeTab === "leaves"
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-light-muted dark:text-dark-muted hover:bg-light-elevated dark:hover:bg-dark-elevated"
                  }`}
                >
                  Pending Leaves ({pendingLeaves.length})
                </button>
                <button
                  onClick={() => setActiveTab("complaints")}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    activeTab === "complaints"
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-light-muted dark:text-dark-muted hover:bg-light-elevated dark:hover:bg-dark-elevated"
                  }`}
                >
                  Recent Complaints ({recentComplaints.length})
                </button>
                <button
                  onClick={() => setActiveTab("visitors")}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    activeTab === "visitors"
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-light-muted dark:text-dark-muted hover:bg-light-elevated dark:hover:bg-dark-elevated"
                  }`}
                >
                  Gate Visitors ({recentVisitors.length})
                </button>
              </div>

              <Link
                to={
                  activeTab === "leaves"
                    ? "/warden/leave"
                    : activeTab === "complaints"
                    ? "/warden/complaints"
                    : "/warden/visitors"
                }
                className="text-xs font-bold text-violet-500 hover:text-violet-400 flex items-center gap-1 self-end sm:self-auto"
              >
                <span>View Full Management Portal</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* TAB 1: PENDING LEAVES WITH 1-CLICK APPROVE/REJECT */}
            {activeTab === "leaves" && (
              <div className="space-y-3">
                {pendingLeaves.length === 0 ? (
                  <div className="py-12 text-center text-light-muted dark:text-dark-muted space-y-2">
                    <CheckCircle size={36} className="text-emerald-500 mx-auto" />
                    <p className="font-bold text-sm">All leave requests are cleared!</p>
                    <p className="text-xs">No pending student outpasses in your block.</p>
                  </div>
                ) : (
                  pendingLeaves.map((leave) => (
                    <motion.div
                      key={leave.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded-2xl border border-light-border dark:border-dark-border/60 bg-light-elevated/40 dark:bg-dark-elevated/40 hover:border-violet-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-light-text dark:text-dark-text">
                            {leave.studentName}
                          </span>
                          <span className="text-xs text-light-muted dark:text-dark-muted font-mono">
                            ({leave.studentReg})
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-500/15 text-amber-500 border border-amber-500/20">
                            {leave.leaveType}
                          </span>
                        </div>
                        <p className="text-xs text-light-muted dark:text-dark-muted line-clamp-1">
                          <span className="font-semibold text-light-text dark:text-dark-text">Reason:</span> {leave.reason} • <span className="font-semibold text-light-text dark:text-dark-text">Dest:</span> {leave.destination}
                        </p>
                        <p className="text-[11px] text-light-muted dark:text-dark-muted flex items-center gap-1.5">
                          <Calendar size={12} className="text-violet-400" />
                          <span>{new Date(leave.fromDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} — {new Date(leave.toDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                        </p>
                      </div>

                      {/* 1-Click Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => approveLeaveMutation.mutate({ id: leave.id, status: "approved" })}
                          disabled={approveLeaveMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => approveLeaveMutation.mutate({ id: leave.id, status: "rejected" })}
                          disabled={approveLeaveMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 transition-colors"
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: COMPLAINTS TRIAGE */}
            {activeTab === "complaints" && (
              <div className="space-y-3">
                {recentComplaints.length === 0 ? (
                  <div className="py-12 text-center text-light-muted dark:text-dark-muted space-y-2">
                    <CheckCircle size={36} className="text-emerald-500 mx-auto" />
                    <p className="font-bold text-sm">No unresolved maintenance complaints!</p>
                  </div>
                ) : (
                  recentComplaints.map((cmp) => (
                    <div
                      key={cmp.id}
                      className="p-3.5 rounded-2xl border border-light-border dark:border-dark-border/60 bg-light-elevated/40 dark:bg-dark-elevated/40 hover:border-rose-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            cmp.priority === "urgent" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                            cmp.priority === "high" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                            "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          }`}>
                            {cmp.priority}
                          </span>
                          <span className="font-bold text-sm text-light-text dark:text-dark-text">
                            {cmp.title}
                          </span>
                        </div>
                        <p className="text-xs text-light-muted dark:text-dark-muted">
                          {cmp.room} • {cmp.studentName} • Category: {cmp.type}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => updateComplaintMutation.mutate({ id: cmp.id, status: "resolved" })}
                          className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: GATE VISITORS MANAGEMENT */}
            {activeTab === "visitors" && (
              <div className="space-y-3">
                {recentVisitors.length === 0 ? (
                  <div className="py-12 text-center text-light-muted dark:text-dark-muted space-y-2">
                    <Users size={36} className="text-cyan-500 mx-auto" />
                    <p className="font-bold text-sm">No visitor passes registered today</p>
                    <p className="text-xs">When students request guest clearances, they will appear here.</p>
                  </div>
                ) : (
                  recentVisitors.map((v) => (
                    <motion.div
                      key={v.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded-2xl border border-light-border dark:border-dark-border/60 bg-light-elevated/40 dark:bg-dark-elevated/40 hover:border-violet-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-light-text dark:text-dark-text">
                            {v.name}
                          </span>
                          <span className="text-xs text-light-muted dark:text-dark-muted font-medium">
                            ({v.relation})
                          </span>
                          <span className="font-mono text-xs font-bold text-cyan-500">
                            {v.visitorNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            v.status === "approved" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" :
                            v.status === "checked_in" ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20" :
                            v.status === "rejected" ? "bg-red-500/15 text-red-400 border border-red-500/20" :
                            "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                          }`}>
                            {v.status}
                          </span>
                        </div>
                        <p className="text-xs text-light-muted dark:text-dark-muted line-clamp-1">
                          <span className="font-semibold text-light-text dark:text-dark-text">Student Host:</span> {v.studentName} ({v.studentReg}) • Room {v.room}
                        </p>
                        <p className="text-xs text-light-muted dark:text-dark-muted">
                          <strong className="text-light-text dark:text-dark-text">Purpose:</strong> {v.purpose} • <span className="font-mono">{v.timeWindow}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                        {v.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateVisitorStatusMutation.mutate({ id: v.id, status: "approved" })}
                              disabled={updateVisitorStatusMutation.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
                            >
                              <Check size={14} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => updateVisitorStatusMutation.mutate({ id: v.id, status: "rejected" })}
                              disabled={updateVisitorStatusMutation.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 transition-colors"
                            >
                              <X size={14} />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {v.status === "approved" && (
                          <button
                            onClick={() => updateVisitorStatusMutation.mutate({ id: v.id, status: "checked_in" })}
                            disabled={updateVisitorStatusMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border border-cyan-500/30 transition-colors"
                          >
                            <CheckCircle size={14} />
                            <span>Check In</span>
                          </button>
                        )}
                        {v.status === "checked_in" && (
                          <button
                            onClick={() => updateVisitorStatusMutation.mutate({ id: v.id, status: "checked_out" })}
                            disabled={updateVisitorStatusMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/30 transition-colors"
                          >
                            <span>Check Out</span>
                          </button>
                        )}
                        <Link
                          to="/warden/visitors"
                          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-light-elevated dark:hover:bg-dark-elevated transition-colors"
                        >
                          <ArrowRight size={15} />
                        </Link>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Duty Log, Today's Visitors & Realtime Notifications */}
        <div className="space-y-6">
          {/* Duty Contact Card */}
          <div
            className="p-5 rounded-2xl card space-y-3"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(30,27,75,0.2) 100%)",
              border: "1px solid rgba(139,92,246,0.2)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Emergency & Gate Hub</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-bold">24/7 Active</span>
            </div>
            <p className="text-sm font-bold text-light-text dark:text-dark-text">Warden Office • Ground Floor Block A</p>
            <div className="space-y-1.5 text-xs text-light-muted dark:text-dark-muted">
              <p className="flex items-center gap-2">
                <PhoneCall size={13} className="text-emerald-400" />
                <span>Intercom: <strong>4421 / 4422</strong></span>
              </p>
              <p className="flex items-center gap-2">
                <Shield size={13} className="text-violet-400" />
                <span>Security Desk: <strong>Gate 1 Main Guard</strong></span>
              </p>
            </div>
          </div>

          {/* Today's Visitors Panel */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold font-display text-sm text-light-text dark:text-dark-text flex items-center gap-2">
                <Users size={16} className="text-cyan-500" />
                Today's Gate Visitors
              </h3>
              <Link to="/warden/visitors" className="text-xs text-violet-500 hover:underline">
                All Passes →
              </Link>
            </div>

            <div className="space-y-2">
              {recentVisitors.length === 0 ? (
                <div className="py-6 text-center text-xs text-light-muted dark:text-dark-muted">
                  <Users size={24} className="mx-auto mb-1.5 text-slate-500" />
                  <p>No visitors logged today</p>
                </div>
              ) : (
                recentVisitors.slice(0, 5).map((v) => (
                  <div
                    key={v.id}
                    className="p-2.5 rounded-xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/40 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-light-text dark:text-dark-text truncate">{v.name}</p>
                      <p className="text-[11px] text-light-muted dark:text-dark-muted truncate">
                        Guest of {v.studentName} ({v.relation})
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${
                      v.status === "approved" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" :
                      v.status === "checked_in" ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20" :
                      v.status === "rejected" ? "bg-red-500/15 text-red-400 border border-red-500/20" :
                      "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                    }`}>
                      {v.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Real-time Activity Stream */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold font-display text-sm text-light-text dark:text-dark-text flex items-center gap-2">
                <Activity size={16} className="text-violet-500" />
                Recent Operational Activity
              </h3>
            </div>

            <div className="space-y-3">
              {recentActivity.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    act.type === "success" ? "bg-emerald-400" :
                    act.type === "warning" ? "bg-amber-400" : "bg-blue-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-light-text dark:text-dark-text">{act.title}</p>
                    <p className="text-light-muted dark:text-dark-muted text-[11px] leading-tight">{act.message}</p>
                    <span className="text-[10px] text-light-muted/60 dark:text-dark-muted/60">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WardenDashboard;
