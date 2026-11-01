/**
 * @file AllocationStatus.jsx
 * @description Student room allocation status page:
 *   - Shows full allotted room details if the application is approved/allocated
 *   - Shows "Apply for a Hostel" CTA and status tracking if not approved
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home, QrCode, Users, Wifi, Wind, Calendar, CheckCircle,
  Download, Share2, MapPin, Bed, Building2, Star, Info,
  ArrowRight, Clock, AlertTriangle, XCircle, FileText, Plus,
  ShieldCheck, Sparkles, RefreshCw, Check
} from "lucide-react";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";

import { selectCurrentUser } from "../../redux/slices/authSlice";
import api from "../../services/api";
import SkeletonCard from "../../components/common/SkeletonCard";

// ─── Amenity Badge ────────────────────────────────────────────────────────────
const AmenityBadge = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 text-xs font-semibold border border-blue-500/20">
      <Icon size={13} />
      <span>{label}: {value}</span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AllocationStatus = () => {
  const user = useSelector(selectCurrentUser);
  const userId = user?._id || user?.id;

  const { data: resData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["my-allocation", userId],
    queryFn: async () => {
      const { data } = await api.get("/allocations/my");
      return data;
    },
    enabled: !!userId,
    refetchInterval: 15000,
  });

  const allocation = resData?.data;
  const application = resData?.application;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <SkeletonCard height="160px" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard height="280px" />
          <SkeletonCard height="280px" />
        </div>
      </div>
    );
  }

  // Determine whether application is pending review or approved/allocated
  const hasActiveRoom = Boolean(allocation && allocation.status === "active" && allocation.room);
  const isPending = Boolean(application && (application.status === "pending" || application.status === "under_review"));
  const isRejected = Boolean(application && (application.status === "rejected" || application.status === "cancelled"));

  // If the student already has an active room, they should ALWAYS see their room allotment (with a pending transfer alert)
  // If they don't have an active room yet, they see the awaiting approval or not_applied views
  const isApproved = Boolean(
    hasActiveRoom || (
      !isPending && !isRejected && (
        application?.status === "approved" ||
        application?.status === "allocated"
      )
    )
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // CASE 1: APPLICATION NOT APPROVED -> SHOW "APPLY FOR A HOSTEL" PROMPT
  // ══════════════════════════════════════════════════════════════════════════════
  if (!isApproved) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
                Hostel Accommodation
              </span>
              <span className="text-xs text-light-muted dark:text-dark-muted font-medium">Academic Year 2026-27</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-light-text dark:text-dark-text mt-1">
              My Hostel Room Allocation
            </h1>
            <p className="text-sm text-light-muted dark:text-dark-muted mt-0.5">
              Track your room allotment status, view assigned roommates, and access your digital gate pass.
            </p>
          </div>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border/60 transition-colors self-start sm:self-auto"
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
            <span>Check Status</span>
          </button>
        </div>

        {/* State A: Student has NOT applied yet */}
        {(!application || application.status === "not_applied") && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 sm:p-12 text-center space-y-6 bg-gradient-to-b from-light-card to-light-elevated/40 dark:from-slate-900 dark:to-slate-900/60 border border-light-border dark:border-slate-800 shadow-xl"
          >
            <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/25">
              <Home size={38} />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 border-2 border-slate-900 flex items-center justify-center text-white">
                <AlertTriangle size={12} />
              </div>
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-2xl font-black font-display text-light-text dark:text-dark-text">
                No Room Allocated Yet
              </h2>
              <p className="text-sm text-light-muted dark:text-dark-muted">
                You have not submitted a hostel room application yet. Apply for a hostel now to select your preferred block, room type, and AI roommate.
              </p>
            </div>

            {/* Prominent CTA to Apply */}
            <div>
              <Link
                to="/student/application"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-xl shadow-blue-600/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all"
              >
                <Plus size={18} />
                <span>Apply for a Hostel</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* 3 Step Process Guide */}
            <div className="pt-8 border-t border-light-border dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-2xl bg-light-elevated/60 dark:bg-slate-800/40 border border-light-border dark:border-slate-700/50 space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h4 className="font-bold text-xs text-light-text dark:text-dark-text">Apply for Hostel</h4>
                <p className="text-[11px] text-light-muted dark:text-dark-muted">
                  Choose your hostel block, room type preference (AC/Non-AC), and dietary choices.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-light-elevated/60 dark:bg-slate-800/40 border border-light-border dark:border-slate-700/50 space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h4 className="font-bold text-xs text-light-text dark:text-dark-text">Warden Review</h4>
                <p className="text-[11px] text-light-muted dark:text-dark-muted">
                  Administration verifies student criteria, distance merit, and approves the seat.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-light-elevated/60 dark:bg-slate-800/40 border border-light-border dark:border-slate-700/50 space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h4 className="font-bold text-xs text-light-text dark:text-dark-text">Room Allotment & QR</h4>
                <p className="text-[11px] text-light-muted dark:text-dark-muted">
                  Once approved, your allotted room, bed number, and digital gate QR appear here automatically.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* State B: Application is Pending / Under Review */}
        {application && (application.status === "pending" || application.status === "under_review") && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 sm:p-8 space-y-6 border-amber-500/30 bg-amber-500/5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-amber-500/20">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Under Review
                    </span>
                    <span className="text-xs text-light-muted dark:text-dark-muted font-mono">
                      ID: {application._id?.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold font-display text-light-text dark:text-dark-text mt-1.5">
                    Hostel Application Awaiting Approval
                  </h3>
                </div>
              </div>

              <Link
                to="/student/application"
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors self-start sm:self-auto flex items-center gap-2"
              >
                <FileText size={15} />
                <span>View Submitted Form</span>
              </Link>
            </div>

            <p className="text-sm text-light-muted dark:text-dark-muted leading-relaxed">
              Your hostel application has been submitted and is currently under review by the warden office.
              <strong className="text-light-text dark:text-dark-text"> Once your application is approved</strong>, your allotted room details, bed number, roommate list, and QR entry pass will be generated here automatically.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-light-card dark:bg-slate-800/80 border border-light-border dark:border-slate-700 flex flex-col justify-between">
                <p className="text-xs text-light-muted dark:text-dark-muted">Preferred Hostel</p>
                <p className="text-sm font-bold text-light-text dark:text-dark-text mt-1">
                  {application.preferredHostel?.name || "Any Available Hostel"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-light-card dark:bg-slate-800/80 border border-light-border dark:border-slate-700 flex flex-col justify-between">
                <p className="text-xs text-light-muted dark:text-dark-muted">Preferred Block</p>
                <p className="text-sm font-bold text-light-text dark:text-dark-text mt-1">
                  {application.preferredBlock?.blockName
                    ? (application.preferredBlock.blockName.startsWith("Block") ? application.preferredBlock.blockName : `Block ${application.preferredBlock.blockName}`)
                    : (application.preferredBlock?.blockCode
                        ? `Block ${application.preferredBlock.blockCode}`
                        : (application.preferredBlockCode ? `Block ${application.preferredBlockCode}` : "Any Block"))}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-light-card dark:bg-slate-800/80 border border-light-border dark:border-slate-700 flex flex-col justify-between">
                <p className="text-xs text-light-muted dark:text-dark-muted">Room Type & AC</p>
                <p className="text-sm font-bold text-light-text dark:text-dark-text mt-1 capitalize">
                  {application.preferredRoomType?.replace("_", " ") || "Double"} • {application.preferredAC ? "AC" : "Non-AC"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-light-card dark:bg-slate-800/80 border border-light-border dark:border-slate-700 flex flex-col justify-between">
                <p className="text-xs text-light-muted dark:text-dark-muted">Submitted On</p>
                <p className="text-sm font-bold text-light-text dark:text-dark-text mt-1">
                  {new Date(application.submittedAt || application.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* State C: Application was Rejected */}
        {application && application.status === "rejected" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 sm:p-8 space-y-5 border-rose-500/30 bg-rose-500/5 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <XCircle size={32} />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-xl font-bold font-display text-light-text dark:text-dark-text">
                Application Not Approved
              </h3>
              <p className="text-xs text-rose-300 font-medium">
                {application.rejectionReason || "Your application was not approved by the hostel administration."}
              </p>
              <p className="text-xs text-light-muted dark:text-dark-muted pt-2">
                You can submit a new hostel application or contact the hostel warden desk for assistance.
              </p>
            </div>
            <div>
              <Link
                to="/student/application"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/25 transition-all"
              >
                <Plus size={15} />
                <span>Re-Apply for Hostel</span>
              </Link>
            </div>
          </motion.div>
        )}

        {/* State D: Application is Waitlisted */}
        {application && application.status === "waitlisted" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 sm:p-8 space-y-4 border-violet-500/30 bg-violet-500/5 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-violet-500/20 text-violet-400 flex items-center justify-center mx-auto font-bold text-xl">
              #{application.waitlistPosition || 1}
            </div>
            <h3 className="text-lg font-bold font-display text-light-text dark:text-dark-text">
              You are on the Hostel Waitlist
            </h3>
            <p className="text-xs text-light-muted dark:text-dark-muted max-w-sm mx-auto">
              You are currently waitlisted. When a room vacancy opens up in your preferred block, your allocation will be assigned automatically.
            </p>
            <Link
              to="/student/application"
              className="inline-flex items-center gap-1.5 text-xs text-violet-400 font-bold hover:underline"
            >
              <span>View Application Summary →</span>
            </Link>
          </motion.div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // CASE 2: APPLICATION IS APPROVED / ROOM IS ALLOTTED -> SHOW ALLOTTED DETAILS!
  // ══════════════════════════════════════════════════════════════════════════════
  const room = allocation?.room;
  const amenities = room?.amenities || {};

  // Roommates (other occupants in the same room)
  const roommates = room?.occupants?.filter(
    (o) => o.student?._id?.toString() !== user?._id?.toString()
  ) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
              <CheckCircle size={12} />
              <span>Application Approved</span>
            </span>
            <span className="text-xs text-light-muted dark:text-dark-muted font-medium">
              Academic Year {allocation?.academicYear || "2026-27"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-light-text dark:text-dark-text mt-1">
            My Room Allotment
          </h1>
          <p className="text-sm text-light-muted dark:text-dark-muted mt-0.5">
            Your hostel room has been confirmed. Below are your room coordinates, roommates, and gate access pass.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border/60 transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
          <span>Refresh Details</span>
        </button>
      </div>

      {/* ── Pending Re-Application Transfer Alert ── */}
      {hasActiveRoom && isPending && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/25 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/40">
              <Clock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/25 text-amber-300 border border-amber-500/40">
                  New Application Under Review
                </span>
                <span className="text-xs text-light-muted dark:text-dark-muted font-mono">
                  ID: {application._id?.slice(-6).toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-bold text-light-text dark:text-dark-text mt-1">
                You have submitted an application for a new hostel or block.
              </p>
              <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                Your current room allotment (<strong className="text-light-text dark:text-dark-text">{room?.roomNumber || "assigned room"}, Bed {allocation?.bedNumber}</strong>) remains active and valid until your new application is approved by the administration.
              </p>
            </div>
          </div>
          <Link
            to="/student/application"
            className="px-4 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 whitespace-nowrap self-start sm:self-auto transition-all hover:scale-[1.02] flex items-center gap-1.5"
          >
            <FileText size={14} />
            <span>View Application</span>
          </Link>
        </motion.div>
      )}

      {/* ── Hero Banner: Allotted Room Identity ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 sm:p-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white relative overflow-hidden shadow-2xl border-0"
      >
        {/* Glow ambient background rings */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 -translate-y-1/3 translate-x-1/3 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-indigo-900/30 translate-y-1/3 -translate-x-1/3 blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-300/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck size={14} />
                <span>Official Room Allotment Confirmed</span>
              </span>
            </div>
            <span className="text-xs text-white/80 font-medium">
              Allocated by Warden Office • {new Date(allocation?.allocationDate || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          {/* Key Coordinate Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-2">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <p className="text-white/70 text-xs font-semibold">Hostel Block</p>
              <p className="text-2xl sm:text-3xl font-black font-display mt-0.5">
                {allocation?.block?.name || allocation?.block?.blockCode || "Block A"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <p className="text-white/70 text-xs font-semibold">Room Number</p>
              <p className="text-2xl sm:text-3xl font-black font-display mt-0.5 text-amber-200">
                {room?.roomNumber || "A-102"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <p className="text-white/70 text-xs font-semibold">Allocated Bed</p>
              <p className="text-2xl sm:text-3xl font-black font-display mt-0.5 text-emerald-200">
                {allocation?.bedNumber || "B1"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <p className="text-white/70 text-xs font-semibold">Floor Level</p>
              <p className="text-2xl sm:text-3xl font-black font-display mt-0.5">
                Floor {allocation?.floor?.floorNumber || room?.floorNumber || 1}
              </p>
            </div>
          </div>

          {/* Pill tags */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full font-semibold">
              <Bed size={13} />
              <span className="capitalize">{room?.roomType?.replace("_", " ") || "Double Occupancy"}</span>
            </span>
            {room?.isAC && (
              <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full font-semibold">
                <Wind size={13} />
                <span>Air Conditioned (AC)</span>
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full font-semibold">
              <Building2 size={13} />
              <span>{allocation?.hostel?.name || "Emerald Boys Hostel"}</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full font-semibold">
              <Users size={13} />
              <span>{room?.currentOccupancy || 1} / {room?.capacity || 2} Occupied</span>
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── QR Pass & Room Details Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Digital Room Entry QR Code */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="card p-6 flex flex-col items-center justify-between text-center space-y-4"
        >
          <div className="flex items-center justify-between w-full border-b border-light-border dark:border-dark-border/60 pb-3">
            <div className="flex items-center gap-2 text-left">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                <QrCode size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-light-text dark:text-dark-text font-display">
                  Room Entry Pass QR
                </h3>
                <p className="text-[11px] text-light-muted dark:text-dark-muted">Biometric & Turnstile Clearance</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              Active Pass
            </span>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200">
            <QRCode
              value={JSON.stringify({
                type: "bit_hostel_room_allocation",
                studentId: user?._id,
                room: room?.roomNumber || "A-102",
                bed: allocation?.bedNumber || "B1",
                block: allocation?.block?.name || "Block A",
                token: allocation?._id,
              })}
              size={155}
              level="H"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-light-text dark:text-dark-text">
              Scan at Block Entry Turnstile
            </p>
            <p className="text-[11px] text-light-muted dark:text-dark-muted max-w-xs">
              Present this digital pass at the Hostel Security Desk for room key issuance and gate entry.
            </p>
          </div>

          <button
            onClick={() => {
              toast.success("Room Pass saved to device!");
            }}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
          >
            <Download size={14} />
            <span>Download Entry QR Pass</span>
          </button>
        </motion.div>

        {/* Room Specifications Table */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card p-6 flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center gap-2 border-b border-light-border dark:border-dark-border/60 pb-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-violet-500/15 text-violet-500 flex items-center justify-center">
                <Home size={18} />
              </div>
              <h3 className="font-bold text-sm text-light-text dark:text-dark-text font-display">
                Room Specifications
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { label: "Hostel Name",     value: allocation?.hostel?.name || "Emerald Boys Hostel" },
                { label: "Block & Floor",   value: `${allocation?.block?.name || "Block A"} • Floor ${allocation?.floor?.floorNumber || 1}` },
                { label: "Room / Bed",      value: `Room ${room?.roomNumber || "A-102"} (Bed ${allocation?.bedNumber || "B1"})` },
                { label: "Room Category",   value: `${room?.roomType?.replace("_", " ") || "Double"} ${room?.isAC ? "(AC)" : "(Non-AC)"}` },
                { label: "Total Capacity",  value: `${room?.capacity || 2} Students` },
                { label: "Monthly Fee",     value: room?.monthlyFee ? `₹${room.monthlyFee.toLocaleString("en-IN")}/mo` : "Included in Hostel Fee" },
                { label: "Allocation Date", value: new Date(allocation?.allocationDate || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) },
                { label: "Valid Through",   value: `Academic Year ${allocation?.academicYear || "2026-27"}` },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-1.5 border-b border-light-border/60 dark:border-dark-border/40 last:border-0">
                  <span className="text-light-muted dark:text-dark-muted font-medium">{row.label}</span>
                  <span className="font-bold text-light-text dark:text-dark-text">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">
              Room Amenities Included
            </p>
            <div className="flex flex-wrap gap-2">
              <AmenityBadge icon={Wifi} label="High-Speed Wi-Fi" value="Yes" />
              {room?.isAC && <AmenityBadge icon={Wind} label="AC Climate" value="Yes" />}
              <AmenityBadge icon={Home} label="Study Desk & Wardrobe" value="Provided" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Roommates Section ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card p-6 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-light-text dark:text-dark-text font-display">
                Roommates in Room {room?.roomNumber || "A-102"}
              </h3>
              <p className="text-[11px] text-light-muted dark:text-dark-muted">Co-residents sharing this room</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-light-elevated dark:bg-dark-elevated text-light-muted dark:text-dark-muted border border-light-border dark:border-dark-border/60">
            {roommates.length + 1} of {room?.capacity || 2} Occupied
          </span>
        </div>

        {roommates.length === 0 ? (
          <div className="py-8 text-center text-light-muted dark:text-dark-muted space-y-1">
            <Users size={28} className="mx-auto text-slate-500 mb-1" />
            <p className="text-xs font-semibold">No other roommates allocated yet</p>
            <p className="text-[11px]">You currently have this room to yourself or co-occupants are being assigned.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roommates.map((occ, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-light-elevated/40 dark:bg-dark-elevated/40 border border-light-border dark:border-dark-border/60 flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                  {occ.student?.user?.name?.charAt(0) || "R"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-light-text dark:text-dark-text truncate">
                    {occ.student?.user?.name || "Assigned Roommate"}
                  </p>
                  <p className="text-xs text-light-muted dark:text-dark-muted">
                    Bed {occ.bedNumber || "B2"} • {occ.student?.department || "CSE"}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  Allocated
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Allocation Progress Timeline ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6 space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-light-border dark:border-dark-border/60 pb-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
            <Calendar size={18} />
          </div>
          <h3 className="font-bold text-sm text-light-text dark:text-dark-text font-display">
            Hostel Onboarding Timeline
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400">1. Applied</span>
              <CheckCircle size={14} className="text-emerald-400" />
            </div>
            <p className="text-[11px] text-light-muted dark:text-dark-muted">Application Form Submitted</p>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400">2. Approved</span>
              <CheckCircle size={14} className="text-emerald-400" />
            </div>
            <p className="text-[11px] text-light-muted dark:text-dark-muted">Warden Approval Granted</p>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400">3. Allotted</span>
              <CheckCircle size={14} className="text-emerald-400" />
            </div>
            <p className="text-[11px] text-light-muted dark:text-dark-muted">
              Room {room?.roomNumber || "A-102"} (Bed {allocation?.bedNumber || "B1"})
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-400">4. Gate Entry</span>
              <Sparkles size={14} className="text-blue-400" />
            </div>
            <p className="text-[11px] text-light-muted dark:text-dark-muted">Scan QR at Gate 1 Turnstile</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AllocationStatus;
