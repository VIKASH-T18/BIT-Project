/**
 * @file HostelApplication.jsx
 * @description Student hostel room application & allocation tracking with
 * spacious, modern, polished UI layout and multi-step preference wizard.
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Bed, Users, Building2, Layers, CheckCircle2,
  Clock, AlertTriangle, XCircle, ArrowRight, ArrowLeft,
  GraduationCap, Stethoscope, Accessibility, Award, MapPin,
  Sparkles, RefreshCw, Trash2, Edit3, Loader2, Send,
  ShieldCheck, FileText, Plus, HelpCircle, Check, Info
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { selectCurrentUser } from "../../redux/slices/authSlice";

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOCKS_DEFAULT = [
  { code: "A", label: "Block A", rooms: 400, gender: "Boys", type: "Double", floors: "Floors 1-4" },
  { code: "B", label: "Block B", rooms: 400, gender: "Boys", type: "Triple", floors: "Floors 1-4" },
  { code: "C", label: "Block C", rooms: 400, gender: "Girls", type: "Double", floors: "Floors 1-3" },
  { code: "D", label: "Block D", rooms: 400, gender: "Girls", type: "Four Sharing", floors: "Floors 1-3" },
];

const ROOM_TYPES = [
  { value: "single", label: "Single", desc: "1 occupant", emoji: "🛏️" },
  { value: "double", label: "Double", desc: "2 occupants", emoji: "👥" },
  { value: "triple", label: "Triple", desc: "3 occupants", emoji: "👨‍👩‍👦" },
  { value: "four_sharing", label: "Four Sharing", desc: "4 occupants", emoji: "🏢" },
];

const STATUS_CONFIG = {
  pending: {
    label: "Pending Review",
    cls: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    icon: Clock,
  },
  under_review: {
    label: "Under Review",
    cls: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Not Approved",
    cls: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
    icon: XCircle,
  },
  waitlisted: {
    label: "Waitlisted",
    cls: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
    icon: AlertTriangle,
  },
  allocated: {
    label: "Room Allocated",
    cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    cls: "bg-slate-500/10 text-slate-400 border border-slate-500/30",
    icon: XCircle,
  },
};

const WIZARD_STEPS = [
  { id: 1, title: "Room Preferences", icon: Bed },
  { id: 2, title: "Priority Details", icon: Accessibility },
  { id: 3, title: "Roommate Choice", icon: Users },
  { id: 4, title: "Review & Submit", icon: Send },
];

// ─── Step Progress Header ──────────────────────────────────────────────────────

const StepIndicator = ({ current }) => (
  <div className="flex items-center justify-between mb-10 px-2 sm:px-6">
    {WIZARD_STEPS.map((step, idx) => {
      const Icon = step.icon;
      const isDone = current > step.id;
      const isActive = current === step.id;
      return (
        <React.Fragment key={step.id}>
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-md ${
                isActive
                  ? "bg-blue-600 text-white shadow-blue-500/30 scale-105"
                  : isDone
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-light-elevated dark:bg-dark-elevated text-light-muted dark:text-dark-muted border border-light-border dark:border-dark-border"
              }`}
            >
              {isDone ? <Check size={18} /> : <Icon size={18} />}
            </div>
            <div className="hidden md:block">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted">
                Step {step.id}
              </p>
              <p
                className={`text-sm font-bold transition-colors ${
                  isActive
                    ? "text-blue-500 dark:text-blue-400"
                    : isDone
                    ? "text-light-text dark:text-dark-text"
                    : "text-light-muted dark:text-dark-muted"
                }`}
              >
                {step.title}
              </p>
            </div>
          </div>

          {idx < WIZARD_STEPS.length - 1 && (
            <div
              className={`h-1 flex-1 mx-4 sm:mx-6 rounded-full transition-all duration-300 ${
                isDone
                  ? "bg-emerald-500/60"
                  : isActive
                  ? "bg-blue-600/50"
                  : "bg-light-border dark:bg-dark-border"
              }`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title, color = "text-blue-400" }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className={`p-1.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 ${color}`}>
      <Icon size={16} />
    </div>
    <h4 className={`text-xs font-bold uppercase tracking-wider ${color}`}>
      {title}
    </h4>
    <div className="flex-1 h-px bg-light-border dark:border-dark-border/80 ml-2" />
  </div>
);

// ─── Existing Application View (Spacious & Polished) ──────────────────────────

const ExistingApplicationView = ({
  currentApp,
  currentAllocation,
  onApplyNew,
  onEdit,
  onDelete,
  isDeleting,
  refetch,
  isFetching,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const statusCfg = STATUS_CONFIG[currentApp.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  const rawStatus = (currentApp.status || "pending").toLowerCase();
  const isPending = rawStatus === "pending";
  const isUnderReview = rawStatus === "under_review";
  const isRejected = rawStatus === "rejected";
  const isWaitlisted = rawStatus === "waitlisted";
  const isAllocated = rawStatus === "allocated";
  const isApproved = rawStatus === "approved";
  const hasDecision = isApproved || isAllocated;
  const isPastReview = ["approved", "allocated", "rejected", "waitlisted"].includes(rawStatus);

  const blockDisplay = currentApp.preferredBlock?.blockName
    ? currentApp.preferredBlock.blockName.startsWith("Block")
      ? currentApp.preferredBlock.blockName
      : `Block ${currentApp.preferredBlock.blockName}`
    : currentApp.preferredBlock?.blockCode
    ? `Block ${currentApp.preferredBlock.blockCode}`
    : currentApp.preferredBlockCode
    ? `Block ${currentApp.preferredBlockCode}`
    : "Any Block";

  const hostelDisplay = currentApp.preferredHostel?.name || "Any Available Hostel";

  const roommateDisplay = currentApp.useAiMatching
    ? "AI Matching (Smart Algorithm)"
    : currentApp.preferredRoommate?.registerNumber
    ? `Friend (${currentApp.preferredRoommate.registerNumber})`
    : currentApp.preferredRoommateRegNo
    ? `Friend (${currentApp.preferredRoommateRegNo})`
    : "Specific Roommate";

  // Priority factors list
  const priorityFactors = [];
  if (currentApp.priorityReasons?.isFinalYear) {
    priorityFactors.push({ label: "Final Year Student", pts: "+40 pts", icon: GraduationCap });
  }
  if (currentApp.priorityReasons?.hasDisability) {
    priorityFactors.push({ label: "Physical Disability", pts: "+30 pts", icon: Accessibility });
  }
  if (currentApp.priorityReasons?.hasMedical) {
    priorityFactors.push({ label: "Medical Condition", pts: "+20 pts", icon: Stethoscope });
  }
  if (currentApp.priorityReasons?.isScholarship) {
    priorityFactors.push({ label: "Scholarship Holder", pts: "+15 pts", icon: Award });
  }
  const dist = currentApp.priorityReasons?.distanceKm
    ? parseFloat(currentApp.priorityReasons.distanceKm)
    : 0;
  if (dist >= 1000) {
    priorityFactors.push({ label: `Distance (${dist} km)`, pts: "+15 pts", icon: MapPin });
  } else if (dist >= 500) {
    priorityFactors.push({ label: `Distance (${dist} km)`, pts: "+10 pts", icon: MapPin });
  }

  // Timeline events
  const timelineEvents = [
    {
      title: "Application Submitted",
      description: `Academic Year ${currentApp.academicYear || "2026-27"}`,
      done: true,
      active: false,
      date: currentApp.submittedAt,
      statusLabel: "Submitted",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Under Review by Warden",
      description: isPastReview
        ? "Warden desk verification completed"
        : isUnderReview
        ? "Currently under review by Warden office"
        : "Application submitted — awaiting warden review",
      done: isPastReview,
      active: isPending || isUnderReview,
      date: isPastReview ? currentApp.reviewedAt || currentApp.updatedAt : null,
      statusLabel: isPastReview ? "Verified" : isUnderReview ? "In Review" : "In Queue",
      statusColor: isPastReview
        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        : isUnderReview
        ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
        : "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Application Decision",
      description: hasDecision
        ? (() => {
            const reviewer = currentApp.reviewedBy;
            const reviewerName = reviewer?.name;
            const reviewerRole =
              reviewer?.role === "warden"
                ? "Warden"
                : reviewer?.role === "admin"
                ? "Admin"
                : "";
            const who = reviewerName
              ? reviewerRole && !reviewerName.toLowerCase().includes(reviewerRole.toLowerCase())
                ? `${reviewerRole} ${reviewerName}`
                : reviewerName
              : "Warden Office";
            let c = (currentApp.reviewComments || "").trim();
            if (
              c.toLowerCase().startsWith("approved by") ||
              c.toLowerCase().startsWith("application approved by")
            ) {
              c = "";
            }
            return `Application Approved by ${who}${c ? ` • "${c}"` : ""}`;
          })()
        : isRejected
        ? `Application Not Approved • ${currentApp.rejectionReason || currentApp.reviewComments || "Requirements not met"}`
        : isWaitlisted
        ? `Waitlisted at position #${currentApp.waitlistPosition || 1}`
        : "Decision pending warden review",
      done: isPastReview,
      active: false,
      isRejected,
      isWaitlisted,
      date: isPastReview ? currentApp.reviewedAt : null,
      statusLabel: hasDecision
        ? "Approved"
        : isRejected
        ? "Rejected"
        : isWaitlisted
        ? "Waitlisted"
        : "Pending",
      statusColor: hasDecision
        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        : isRejected
        ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
        : isWaitlisted
        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
        : "text-light-muted dark:text-dark-muted bg-light-elevated dark:bg-dark-elevated border-light-border dark:border-dark-border",
    },
    {
      title: "Room Allocated",
      description: isAllocated
        ? `Allotted Room ${currentAllocation?.room?.roomNumber || currentApp.preferredBlockCode || "Assigned"} (Bed ${currentAllocation?.bedNumber || "Assigned"}) in ${
            currentAllocation?.block?.blockName
              ? `Block ${currentAllocation.block.blockName}`
              : currentApp.preferredBlock?.blockName
              ? `Block ${currentApp.preferredBlock.blockName}`
              : "Hostel Block"
          }`
        : isApproved
        ? "Application approved! Room and bed assignment in progress..."
        : isRejected || isWaitlisted
        ? "Room allocation not applicable"
        : "Room allocation occurs after application approval",
      done: isAllocated,
      active: isApproved,
      date: isAllocated ? currentAllocation?.allocationDate || currentApp.updatedAt : null,
      statusLabel: isAllocated ? "Allocated" : isApproved ? "Assigning..." : "Pending",
      statusColor: isAllocated
        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        : isApproved
        ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
        : "text-light-muted dark:text-dark-muted bg-light-elevated dark:bg-dark-elevated border-light-border dark:border-dark-border",
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* ── Banner: Apply for New Hostel / Actions ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 sm:p-8 bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-purple-600/15 border border-blue-500/30 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Plus size={20} />
            </div>
            <h3 className="text-xl font-bold font-display text-light-text dark:text-dark-text">
              Apply for a New Hostel
            </h3>
          </div>
          <p className="text-sm text-light-muted dark:text-dark-muted leading-relaxed pl-0.5">
            {isAllocated
              ? "Already have an allocated room? You can submit a fresh application for a new hostel or block anytime."
              : "Want to select a different hostel, block, or room type? Edit your details or submit a fresh form."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <button
            onClick={onEdit}
            className="h-11 px-5 rounded-xl text-xs sm:text-sm font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] shadow-sm"
          >
            <Edit3 size={15} />
            <span>Edit Details</span>
          </button>

          <button
            onClick={onApplyNew}
            className="h-11 px-6 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            <Plus size={16} />
            <span>Apply for New Hostel</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="h-11 px-4 rounded-xl text-xs sm:text-sm font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/25 transition-all flex items-center justify-center gap-1.5"
            title="Delete Application"
          >
            <Trash2 size={15} />
            <span className="hidden sm:inline">Delete Application</span>
          </button>
        </div>
      </motion.div>

      {/* ── Card: Application Header Status Summary ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card p-6 sm:p-8 rounded-3xl border border-light-border dark:border-dark-border shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 shadow-sm">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-light-text dark:text-dark-text">
              Your Hostel Application
            </h2>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5 font-medium">
              Academic Year: <span className="font-semibold text-light-text dark:text-dark-text">{currentApp.academicYear || "2026-27"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => refetch()}
            className="h-9 w-9 rounded-xl border border-light-border dark:border-dark-border text-light-muted hover:text-light-text hover:bg-light-elevated dark:hover:bg-dark-elevated transition-colors flex items-center justify-center flex-shrink-0"
            title="Refresh Status"
          >
            <RefreshCw size={15} className={isFetching ? "animate-spin text-blue-500" : ""} />
          </button>

          <span className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-xl text-xs font-bold ${statusCfg.cls}`}>
            <StatusIcon size={14} />
            <span>{statusCfg.label}</span>
          </span>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="h-9 w-9 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors flex items-center justify-center flex-shrink-0"
            title="Delete Application"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </motion.div>

      {/* ── Card: Application Timeline ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6 sm:p-8 rounded-3xl border border-light-border dark:border-dark-border shadow-lg space-y-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-light-text dark:text-dark-text">
                Application Timeline
              </h3>
              <p className="text-xs text-light-muted dark:text-dark-muted">Track progress through the hostel allocation lifecycle</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusCfg.cls}`}>
            {statusCfg.label}
          </span>
        </div>

        {/* Timeline Items */}
        <div className="space-y-6">
          {timelineEvents.map((evt, idx) => (
            <div key={idx} className="flex items-stretch gap-4 sm:gap-5">
              {/* Bullet Node & Connecting Vertical Line */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    evt.done
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30"
                      : evt.active
                      ? "bg-blue-600 border-blue-400 text-white animate-pulse"
                      : "bg-light-elevated dark:bg-dark-elevated border-light-border dark:border-dark-border text-light-muted"
                  }`}
                >
                  {evt.done ? (
                    <Check size={16} />
                  ) : evt.active ? (
                    <Clock size={15} />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-light-muted dark:bg-dark-muted" />
                  )}
                </div>
                {idx < timelineEvents.length - 1 && (
                  <div className="w-0.5 flex-1 min-h-[36px] bg-light-border dark:border-dark-border/80 my-1" />
                )}
              </div>

              {/* Event Content & Status Badge */}
              <div className="min-w-0 flex-1 py-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="text-base font-bold text-light-text dark:text-dark-text">
                      {evt.title}
                    </h4>
                    {evt.date && (
                      <span className="text-xs text-light-muted dark:text-dark-muted flex items-center gap-1 font-medium">
                        <Clock size={12} />
                        {new Date(evt.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-light-muted dark:text-dark-muted leading-relaxed">
                    {evt.description}
                  </p>
                </div>

                <span
                  className={`flex-shrink-0 self-start sm:self-center px-3 py-1 rounded-xl text-xs font-bold border ${evt.statusColor}`}
                >
                  {evt.statusLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Card: Application Details ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card p-6 sm:p-8 rounded-3xl border border-light-border dark:border-dark-border shadow-lg space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-light-border dark:border-dark-border">
          <div>
            <h3 className="text-lg font-bold font-display text-light-text dark:text-dark-text">
              Application Details
            </h3>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
              Specific preferences and requirements you selected in your application
            </p>
          </div>

          <button
            onClick={onEdit}
            className="px-4 py-2 rounded-xl text-xs font-bold text-blue-500 hover:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Edit3 size={14} />
            <span>Edit Details</span>
          </button>
        </div>

        {/* Spacious 4-Column Grid (Row 1: 4 items, Row 2: 4 items) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/80 flex flex-col justify-between min-h-[86px] h-full space-y-2 transition-all hover:border-blue-500/30">
            <div className="flex items-center gap-2 text-light-muted dark:text-dark-muted">
              <Building2 size={16} className="text-indigo-400 flex-shrink-0" />
              <span className="text-xs font-semibold">Preferred Hostel</span>
            </div>
            <p className="text-base font-bold text-light-text dark:text-dark-text">
              {hostelDisplay}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/80 flex flex-col justify-between min-h-[86px] h-full space-y-2 transition-all hover:border-blue-500/30">
            <div className="flex items-center gap-2 text-light-muted dark:text-dark-muted">
              <Layers size={16} className="text-violet-400 flex-shrink-0" />
              <span className="text-xs font-semibold">Preferred Block</span>
            </div>
            <p className="text-base font-bold text-light-text dark:text-dark-text">
              {blockDisplay}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/80 flex flex-col justify-between min-h-[86px] h-full space-y-2 transition-all hover:border-blue-500/30">
            <div className="flex items-center gap-2 text-light-muted dark:text-dark-muted">
              <Bed size={16} className="text-blue-400 flex-shrink-0" />
              <span className="text-xs font-semibold">Room Type</span>
            </div>
            <p className="text-base font-bold text-light-text dark:text-dark-text capitalize">
              {(currentApp.preferredRoomType || "double").replace("_", " ")}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/80 flex flex-col justify-between min-h-[86px] h-full space-y-2 transition-all hover:border-blue-500/30">
            <div className="flex items-center gap-2 text-light-muted dark:text-dark-muted">
              <Sparkles size={16} className="text-cyan-400 flex-shrink-0" />
              <span className="text-xs font-semibold">AC Preference</span>
            </div>
            <p className="text-base font-bold text-cyan-400">
              {currentApp.preferredAC ? "AC Room" : "Non-AC Standard"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/80 flex flex-col justify-between min-h-[86px] h-full space-y-2 transition-all hover:border-blue-500/30">
            <div className="flex items-center gap-2 text-light-muted dark:text-dark-muted">
              <Layers size={16} className="text-amber-400 flex-shrink-0" />
              <span className="text-xs font-semibold">Preferred Floor</span>
            </div>
            <p className="text-base font-bold text-light-text dark:text-dark-text">
              {currentApp.preferredFloor ? `Floor ${currentApp.preferredFloor}` : "Any Floor"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/80 flex flex-col justify-between min-h-[86px] h-full space-y-2 transition-all hover:border-blue-500/30">
            <div className="flex items-center gap-2 text-light-muted dark:text-dark-muted">
              <Users size={16} className="text-purple-400 flex-shrink-0" />
              <span className="text-xs font-semibold">Roommate Choice</span>
            </div>
            <p className="text-base font-bold text-purple-400 truncate" title={roommateDisplay}>
              {roommateDisplay}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/80 flex flex-col justify-between min-h-[86px] h-full space-y-2 transition-all hover:border-blue-500/30">
            <div className="flex items-center gap-2 text-light-muted dark:text-dark-muted">
              <Award size={16} className="text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-semibold">Priority Score</span>
            </div>
            <p className="text-base font-black text-blue-500 dark:text-blue-400">
              {currentApp.priorityScore || 0} / 100
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/80 flex flex-col justify-between min-h-[86px] h-full space-y-2 transition-all hover:border-blue-500/30">
            <div className="flex items-center gap-2 text-light-muted dark:text-dark-muted">
              <MapPin size={16} className="text-rose-400 flex-shrink-0" />
              <span className="text-xs font-semibold">Distance from Home</span>
            </div>
            <p className="text-base font-bold text-light-text dark:text-dark-text">
              {currentApp.priorityReasons?.distanceKm
                ? `${currentApp.priorityReasons.distanceKm} km`
                : "Not specified"}
            </p>
          </div>

          {currentApp.waitlistPosition && (
            <div className="sm:col-span-2 lg:col-span-4 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
              <span className="text-xs text-orange-400/80 font-semibold">Waitlist Position</span>
              <span className="text-base font-bold text-orange-400">#{currentApp.waitlistPosition}</span>
            </div>
          )}
        </div>

        {/* Claimed Priority Factors */}
        <div className="pt-4 border-t border-light-border dark:border-dark-border space-y-3">
          <p className="text-xs font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">
            Claimed Priority Factors:
          </p>
          {priorityFactors.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {priorityFactors.map(({ label, pts, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/25 shadow-sm"
                >
                  <Icon size={15} />
                  <span>{label}</span>
                  <span className="text-[11px] font-bold text-emerald-400 ml-1 bg-emerald-500/15 px-1.5 py-0.5 rounded-md border border-emerald-500/25">
                    {pts}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-light-elevated dark:bg-dark-elevated text-light-muted dark:text-dark-muted border border-light-border dark:border-dark-border">
              Standard Quota (General Criteria)
            </span>
          )}
        </div>

        {/* Remarks / Reasons */}
        {currentApp.reviewComments && (
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Warden Remarks</p>
            <p className="text-sm text-blue-300 leading-relaxed">{currentApp.reviewComments}</p>
          </div>
        )}

        {currentApp.rejectionReason && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
            <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Rejection Reason</p>
            <p className="text-sm text-rose-300 leading-relaxed">{currentApp.rejectionReason}</p>
          </div>
        )}
      </motion.div>

      {/* ── Modal: Delete Confirmation ───────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="card max-w-lg w-full p-7 space-y-5 border border-rose-500/30 rounded-3xl shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-light-text dark:text-dark-text font-display">
                    Delete Application?
                  </h3>
                  <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                    Academic Year {currentApp.academicYear}
                  </p>
                </div>
              </div>

              <p className="text-sm text-light-muted dark:text-dark-muted leading-relaxed">
                Are you sure you want to delete this hostel application? Your application (Status:{" "}
                <span className="font-semibold text-light-text dark:text-dark-text capitalize">
                  {currentApp.status}
                </span>
                ) will be removed. You can then submit a fresh application.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-light-muted hover:text-light-text hover:bg-light-elevated dark:hover:bg-dark-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(currentApp._id);
                    setShowDeleteModal(false);
                  }}
                  disabled={isDeleting}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Yes, Delete Application</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const HostelApplication = () => {
  const queryClient = useQueryClient();
  const user = useSelector(selectCurrentUser);
  const studentId = user?._id || user?.id;

  const [step, setStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    preferredHostelId: "",
    preferredBlockCode: "",
    preferredRoomType: "double",
    preferredAC: false,
    preferredFloor: "",
    priorityReasons: {
      isFinalYear: false,
      hasMedical: false,
      hasDisability: false,
      isScholarship: false,
      distanceKm: "",
    },
    preferredRoommateRegNo: "",
    useAiMatching: true,
  });

  // Query student applications
  const {
    data: applications,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["my-applications", studentId],
    queryFn: async () => {
      const { data } = await api.get("/applications/my");
      return data.data;
    },
    enabled: !!studentId,
    refetchInterval: 5000,
  });

  // Query current room allocation
  const { data: allocationRes } = useQuery({
    queryKey: ["my-allocation", studentId],
    queryFn: async () => {
      try {
        const { data } = await api.get("/allocations/my");
        return data;
      } catch {
        return null;
      }
    },
    enabled: !!studentId,
    refetchInterval: 6000,
  });

  const currentAllocation = allocationRes?.data;

  // Query hostels list
  const { data: hostels = [] } = useQuery({
    queryKey: ["hostels-list"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/hostels");
        return data.data || [];
      } catch {
        return [];
      }
    },
  });

  // Query hostel blocks
  const { data: blocks = [] } = useQuery({
    queryKey: ["hostel-blocks", form.preferredHostelId],
    enabled: !!form.preferredHostelId,
    queryFn: async () => {
      try {
        const { data } = await api.get(`/hostels/${form.preferredHostelId}/blocks`);
        return data.data || [];
      } catch {
        return [];
      }
    },
  });

  const existingApp = applications?.[0];

  const populateFormWithExisting = () => {
    if (!existingApp) return;
    setForm({
      preferredHostelId:
        existingApp.preferredHostel?._id ||
        (typeof existingApp.preferredHostel === "string" ? existingApp.preferredHostel : ""),
      preferredBlockCode:
        existingApp.preferredBlockCode ||
        existingApp.preferredBlock?.blockCode ||
        existingApp.preferredBlock?.blockName?.replace(/^Block\s*/i, "") ||
        "",
      preferredRoomType: existingApp.preferredRoomType || "double",
      preferredAC: !!existingApp.preferredAC,
      preferredFloor:
        existingApp.preferredFloor !== undefined && existingApp.preferredFloor !== null
          ? String(existingApp.preferredFloor)
          : "",
      priorityReasons: {
        isFinalYear: !!existingApp.priorityReasons?.isFinalYear,
        hasMedical: !!existingApp.priorityReasons?.hasMedical,
        hasDisability: !!existingApp.priorityReasons?.hasDisability,
        isScholarship: !!existingApp.priorityReasons?.isScholarship,
        distanceKm:
          existingApp.priorityReasons?.distanceKm !== undefined &&
          existingApp.priorityReasons?.distanceKm !== null
            ? String(existingApp.priorityReasons.distanceKm)
            : "",
      },
      preferredRoommateRegNo:
        existingApp.preferredRoommate?.registerNumber || existingApp.preferredRoommateRegNo || "",
      useAiMatching: existingApp.useAiMatching !== false,
    });
  };

  const handleEditClick = () => {
    populateFormWithExisting();
    setIsEditing(true);
    setStep(1);
  };

  const handleApplyNewClick = () => {
    populateFormWithExisting();
    setIsEditing(true);
    setStep(1);
  };

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/applications", payload);
      return data;
    },
    onSuccess: () => {
      toast.success(
        existingApp
          ? "Application updated successfully! Sent for warden review."
          : "Application submitted successfully!"
      );
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      queryClient.invalidateQueries({ queryKey: ["my-allocation"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      setIsEditing(false);
      setStep(1);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Submission failed.");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/applications/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success("Application deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      queryClient.invalidateQueries({ queryKey: ["my-allocation"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      setIsEditing(true);
      setStep(1);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete application.");
    },
  });

  const handleSubmit = () => {
    const year = new Date().getFullYear();
    const matchedBlock = blocks?.find(
      (b) =>
        b.blockName === form.preferredBlockCode ||
        b.blockCode === form.preferredBlockCode ||
        b._id === form.preferredBlockCode ||
        (b.blockName && b.blockName.toUpperCase().includes(form.preferredBlockCode?.toUpperCase()))
    );

    submitMutation.mutate({
      studentId: user?._id || user?.studentId || undefined,
      studentRegNo: user?.registerNumber || undefined,
      preferredHostel: form.preferredHostelId || undefined,
      preferredBlock: matchedBlock?._id || undefined,
      preferredBlockCode: form.preferredBlockCode || undefined,
      preferredRoomType: form.preferredRoomType || "double",
      preferredAC: !!form.preferredAC,
      preferredFloor: form.preferredFloor ? parseInt(form.preferredFloor, 10) : undefined,
      preferredRoommateRegNo:
        !form.useAiMatching && form.preferredRoommateRegNo
          ? form.preferredRoommateRegNo.trim()
          : undefined,
      useAiMatching: form.useAiMatching,
      academicYear: `${year}-${(year + 1).toString().slice(2)}`,
      priorityReasons: {
        isFinalYear: !!form.priorityReasons.isFinalYear,
        hasMedical: !!form.priorityReasons.hasMedical,
        hasDisability: !!form.priorityReasons.hasDisability,
        isScholarship: !!form.priorityReasons.isScholarship,
        distanceKm: parseFloat(form.priorityReasons.distanceKm) || 0,
      },
    });
  };

  const updateField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const availableBlocks =
    blocks.length > 0
      ? blocks.map((b) => ({
          code: b.blockName?.replace(/^Block\s*/i, "").trim() || b.blockCode?.replace(/^BLK-/i, "") || b._id,
          label: b.blockName?.startsWith("Block") ? b.blockName : `Block ${b.blockName}`,
          rooms: b.totalRooms || 40,
          gender: b.gender ? b.gender.charAt(0).toUpperCase() + b.gender.slice(1) : "",
          type: b.description || "",
          floors: `${b.totalFloors || 3} Floors`,
        }))
      : BLOCKS_DEFAULT;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-light-border dark:border-dark-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
              Hostel Accommodation Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-light-text dark:text-dark-text">
            {isEditing ? "Apply for a New Hostel" : "Hostel Application & Allocation"}
          </h1>
          <p className="text-sm text-light-muted dark:text-dark-muted mt-0.5">
            {isEditing
              ? "Select your preferred hostel, block, room type, and amenities."
              : "Review your current allocation status or submit a new application."}
          </p>
        </div>

        {existingApp && (
          <div className="flex items-center gap-2 p-1.5 bg-light-surface dark:bg-dark-surface rounded-2xl border border-light-border dark:border-dark-border self-start sm:self-auto shadow-sm">
            <button
              onClick={() => {
                setIsEditing(false);
                setStep(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                !isEditing
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-light-muted hover:text-light-text"
              }`}
            >
              <CheckCircle2 size={16} />
              <span>Allocation Status</span>
            </button>
            <button
              onClick={handleEditClick}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                isEditing
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
              }`}
            >
              <Edit3 size={16} />
              <span>Edit Application</span>
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-4">
          <Loader2 size={36} className="animate-spin text-blue-500 mx-auto" />
          <p className="text-base font-semibold text-light-muted dark:text-dark-muted">
            Loading your hostel application...
          </p>
        </div>
      ) : !isEditing && existingApp ? (
        <ExistingApplicationView
          currentApp={existingApp}
          currentAllocation={currentAllocation}
          onApplyNew={handleApplyNewClick}
          onEdit={handleEditClick}
          onDelete={(id) => deleteMutation.mutate(id)}
          isDeleting={deleteMutation.isPending}
          refetch={refetch}
          isFetching={isFetching}
        />
      ) : (
        <div className="space-y-8">
          {existingApp && (
            <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Info size={20} className="text-blue-400 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-light-text dark:text-dark-text leading-relaxed">
                  You are updating your application for <strong>{existingApp.academicYear}</strong> (Status:{" "}
                  <span className="capitalize font-semibold text-blue-400">{existingApp.status}</span>
                  ). Submitting this form will update your application to the new preferences.
                </p>
              </div>
              <div className="flex items-center gap-2.5 self-end sm:self-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-light-border dark:border-dark-border text-xs font-semibold text-light-muted hover:text-light-text hover:bg-light-elevated dark:hover:bg-dark-elevated transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(existingApp._id)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all"
                >
                  {deleteMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}

          {/* Stepper Wizard Indicator */}
          <StepIndicator current={step} />

          {/* Wizard Card Body */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="card p-6 sm:p-10 rounded-3xl border border-light-border dark:border-dark-border shadow-2xl space-y-8"
          >
            {/* ── STEP 1: Room Preferences ────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-8">
                <div className="flex items-center gap-3.5 pb-6 border-b border-light-border dark:border-dark-border">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-sm">
                    <Bed size={22} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-light-text dark:text-dark-text">
                      Room Preferences
                    </h2>
                    <p className="text-xs sm:text-sm text-light-muted dark:text-dark-muted mt-0.5">
                      Choose your hostel, block, room type, and comfort amenities
                    </p>
                  </div>
                </div>

                {/* Hostel Selector */}
                {hostels.length > 0 && (
                  <div className="space-y-2.5">
                    <SectionHeader icon={Building2} title="Hostel Campus" color="text-indigo-400" />
                    <select
                      value={form.preferredHostelId}
                      onChange={(e) => {
                        updateField("preferredHostelId", e.target.value);
                        updateField("preferredBlockCode", "");
                      }}
                      className="bit-input text-sm py-3"
                    >
                      <option value="">No preference — any available hostel</option>
                      {hostels.map((h) => (
                        <option key={h._id} value={h._id}>
                          {h.name} ({h.type})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Block Selector */}
                <div className="space-y-3.5">
                  <SectionHeader icon={Layers} title="Block Selection" color="text-violet-400" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {availableBlocks.map((b) => {
                      const isSelected = form.preferredBlockCode === b.code;
                      return (
                        <button
                          key={b.code}
                          type="button"
                          onClick={() => updateField("preferredBlockCode", isSelected ? "" : b.code)}
                          className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                            isSelected
                              ? "border-blue-500 bg-blue-500/15 shadow-md shadow-blue-500/20"
                              : "border-light-border dark:border-dark-border hover:border-blue-400/50 bg-light-elevated/30 dark:bg-dark-elevated/30"
                          }`}
                        >
                          <div
                            className={`text-2xl font-black mb-1.5 ${
                              isSelected ? "text-blue-400" : "text-light-text dark:text-dark-text"
                            }`}
                          >
                            {b.code}
                          </div>
                          <p
                            className={`text-xs font-bold ${
                              isSelected ? "text-blue-400" : "text-light-muted dark:text-dark-muted"
                            }`}
                          >
                            {b.rooms} rooms
                          </p>
                          <p className="text-xs text-light-muted dark:text-dark-muted mt-1">{b.gender}</p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-light-muted dark:text-dark-muted pl-1">
                    {form.preferredBlockCode
                      ? `Selected Block ${form.preferredBlockCode}: ${
                          BLOCKS_DEFAULT.find((b) => b.code === form.preferredBlockCode)?.gender || "Co-ed"
                        }, ${
                          BLOCKS_DEFAULT.find((b) => b.code === form.preferredBlockCode)?.type || "Shared"
                        } rooms`
                      : "No block selected — any block will be considered"}
                  </p>
                </div>

                {/* Room Type */}
                <div className="space-y-3.5">
                  <SectionHeader icon={Bed} title="Room Type" color="text-blue-400" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {ROOM_TYPES.map((t) => {
                      const isSelected = form.preferredRoomType === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => updateField("preferredRoomType", t.value)}
                          className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                            isSelected
                              ? "border-blue-500 bg-blue-500/15 shadow-md shadow-blue-500/20"
                              : "border-light-border dark:border-dark-border hover:border-blue-400/50 bg-light-elevated/30 dark:bg-dark-elevated/30"
                          }`}
                        >
                          <div className="text-2xl mb-2">{t.emoji}</div>
                          <p
                            className={`text-base font-bold ${
                              isSelected ? "text-blue-400" : "text-light-text dark:text-dark-text"
                            }`}
                          >
                            {t.label}
                          </p>
                          <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">{t.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Floor & AC Preferences */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-light-text dark:text-dark-text uppercase tracking-wider">
                      Preferred Floor
                    </label>
                    <select
                      value={form.preferredFloor}
                      onChange={(e) => updateField("preferredFloor", e.target.value)}
                      className="bit-input text-sm py-3"
                    >
                      <option value="">No preference</option>
                      <option value="0">Ground Floor</option>
                      <option value="1">Floor 1</option>
                      <option value="2">Floor 2</option>
                      <option value="3">Floor 3</option>
                      <option value="4">Floor 4</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl border border-light-border dark:border-dark-border bg-light-elevated/30 dark:bg-dark-elevated/30">
                    <div>
                      <p className="text-sm font-bold text-light-text dark:text-dark-text">Air Conditioning (AC)</p>
                      <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                        Subject to room availability & tariff
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.preferredAC}
                      onChange={(e) => updateField("preferredAC", e.target.checked)}
                      className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Priority Details ────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-8">
                <div className="flex items-center gap-3.5 pb-6 border-b border-light-border dark:border-dark-border">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-sm">
                    <Accessibility size={22} className="text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-light-text dark:text-dark-text">
                      Merit & Priority Details
                    </h2>
                    <p className="text-xs sm:text-sm text-light-muted dark:text-dark-muted mt-0.5">
                      Earn allocation priority points through recognized campus criteria
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      key: "isFinalYear",
                      title: "Final Year Student",
                      desc: "Priority allotment for 4th year undergraduate & final year postgraduate students",
                      pts: "+40 pts",
                      icon: GraduationCap,
                    },
                    {
                      key: "hasDisability",
                      title: "Physical Disability / Special Needs",
                      desc: "Ground-floor accessible room priority and mobility assistance",
                      pts: "+30 pts",
                      icon: Accessibility,
                    },
                    {
                      key: "hasMedical",
                      title: "Medical Condition Requiring Proximity",
                      desc: "Chronic condition requiring closer warden & dispensary supervision",
                      pts: "+20 pts",
                      icon: Stethoscope,
                    },
                    {
                      key: "isScholarship",
                      title: "Merit / Institutional Scholarship Holder",
                      desc: "Academic excellence concession priority",
                      pts: "+15 pts",
                      icon: Award,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isChecked = !!form.priorityReasons[item.key];
                    return (
                      <label
                        key={item.key}
                        className={`flex items-start justify-between gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                          isChecked
                            ? "border-purple-500/60 bg-purple-500/10 shadow-sm"
                            : "border-light-border dark:border-dark-border hover:border-purple-400/30 bg-light-elevated/20 dark:bg-dark-elevated/20"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-base font-bold text-light-text dark:text-dark-text">
                                {item.title}
                              </p>
                              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                {item.pts}
                              </span>
                            </div>
                            <p className="text-xs text-light-muted dark:text-dark-muted mt-1 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              priorityReasons: {
                                ...prev.priorityReasons,
                                [item.key]: e.target.checked,
                              },
                            }))
                          }
                          className="w-5 h-5 mt-1 rounded-lg text-purple-600 focus:ring-purple-500"
                        />
                      </label>
                    );
                  })}
                </div>

                <div className="p-6 rounded-2xl bg-light-elevated/40 dark:bg-dark-elevated/40 border border-light-border dark:border-dark-border space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-rose-400" />
                    <label className="text-sm font-bold text-light-text dark:text-dark-text">
                      Distance from Home City (in Kilometers)
                    </label>
                  </div>
                  <input
                    type="number"
                    value={form.priorityReasons.distanceKm}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        priorityReasons: {
                          ...prev.priorityReasons,
                          distanceKm: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. 650"
                    className="bit-input text-sm py-3"
                  />
                  <p className="text-xs text-light-muted dark:text-dark-muted">
                    Students traveling 500+ km receive +10 priority points; 1,000+ km receive +15 points.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 3: Roommate Choice ─────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-8">
                <div className="flex items-center gap-3.5 pb-6 border-b border-light-border dark:border-dark-border">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-sm">
                    <Users size={22} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-light-text dark:text-dark-text">
                      Roommate Choice
                    </h2>
                    <p className="text-xs sm:text-sm text-light-muted dark:text-dark-muted mt-0.5">
                      Choose AI smart compatibility matching or specify a roommate friend
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div
                    onClick={() => updateField("useAiMatching", true)}
                    className={`p-6 rounded-3xl border-2 cursor-pointer transition-all space-y-3 ${
                      form.useAiMatching
                        ? "border-blue-500 bg-blue-500/15 shadow-lg shadow-blue-500/10"
                        : "border-light-border dark:border-dark-border hover:border-blue-400/40 bg-light-elevated/20 dark:bg-dark-elevated/20"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shadow-inner">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-light-text dark:text-dark-text">
                        AI Compatibility Matching
                      </h3>
                      <p className="text-xs text-light-muted dark:text-dark-muted mt-1 leading-relaxed">
                        Matches you with roommates who share similar sleep hours, study routines, and cleanliness habits.
                      </p>
                    </div>
                    <span className="inline-block text-xs font-bold text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">
                      Recommended
                    </span>
                  </div>

                  <div
                    onClick={() => updateField("useAiMatching", false)}
                    className={`p-6 rounded-3xl border-2 cursor-pointer transition-all space-y-3 ${
                      !form.useAiMatching
                        ? "border-blue-500 bg-blue-500/15 shadow-lg shadow-blue-500/10"
                        : "border-light-border dark:border-dark-border hover:border-blue-400/40 bg-light-elevated/20 dark:bg-dark-elevated/20"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shadow-inner">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-light-text dark:text-dark-text">
                        Choose Specific Friend
                      </h3>
                      <p className="text-xs text-light-muted dark:text-dark-muted mt-1 leading-relaxed">
                        Enter your friend's college register number. Both must cross-request each other to confirm allotment.
                      </p>
                    </div>
                    <span className="inline-block text-xs font-bold text-purple-400 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">
                      Mutual Request
                    </span>
                  </div>
                </div>

                {!form.useAiMatching && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-3xl bg-light-elevated/40 dark:bg-dark-elevated/40 border border-light-border dark:border-dark-border space-y-3"
                  >
                    <label className="block text-sm font-bold text-light-text dark:text-dark-text">
                      Friend's Register Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.preferredRoommateRegNo}
                      onChange={(e) => updateField("preferredRoommateRegNo", e.target.value.toUpperCase())}
                      placeholder="e.g. 7376221CS101"
                      className="bit-input text-sm py-3 tracking-wider font-mono uppercase"
                    />
                    <p className="text-xs text-light-muted dark:text-dark-muted">
                      Both students must request each other for a guaranteed roommate match.
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* ── STEP 4: Review & Submit ─────────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-8">
                <div className="flex items-center gap-3.5 pb-6 border-b border-light-border dark:border-dark-border">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-sm">
                    <Send size={22} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-light-text dark:text-dark-text">
                      Review and Submit
                    </h2>
                    <p className="text-xs sm:text-sm text-light-muted dark:text-dark-muted mt-0.5">
                      Confirm your choices before submitting to the Warden Office
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-light-border dark:border-dark-border overflow-hidden divide-y divide-light-border dark:divide-dark-border">
                  {[
                    {
                      label: "Preferred Block",
                      value: form.preferredBlockCode ? `Block ${form.preferredBlockCode}` : "No preference",
                    },
                    {
                      label: "Room Type",
                      value: form.preferredRoomType.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                    },
                    {
                      label: "AC Preference",
                      value: form.preferredAC ? "Yes - AC requested" : "No - Standard Room",
                    },
                    {
                      label: "Preferred Floor",
                      value: form.preferredFloor ? `Floor ${form.preferredFloor}` : "No preference",
                    },
                    {
                      label: "Roommate Match",
                      value: form.useAiMatching
                        ? "AI Smart Compatibility"
                        : `Specific: ${form.preferredRoommateRegNo || "None"}`,
                    },
                    {
                      label: "Final Year Student",
                      value: form.priorityReasons.isFinalYear ? "Yes (+40 pts)" : "No",
                    },
                    {
                      label: "Physical Disability",
                      value: form.priorityReasons.hasDisability ? "Yes (+30 pts)" : "No",
                    },
                    {
                      label: "Medical Condition",
                      value: form.priorityReasons.hasMedical ? "Yes (+20 pts)" : "No",
                    },
                    {
                      label: "Scholarship",
                      value: form.priorityReasons.isScholarship ? "Yes (+15 pts)" : "No",
                    },
                    {
                      label: "Distance from Home",
                      value: form.priorityReasons.distanceKm
                        ? `${form.priorityReasons.distanceKm} km`
                        : "Not specified",
                    },
                  ].map((row, idx) => (
                    <div
                      key={row.label}
                      className={`flex items-center justify-between px-6 py-4 ${
                        idx % 2 === 0 ? "bg-transparent" : "bg-light-elevated/20 dark:bg-dark-elevated/20"
                      }`}
                    >
                      <span className="text-sm text-light-muted dark:text-dark-muted">{row.label}</span>
                      <span className="text-sm font-bold text-light-text dark:text-dark-text text-right">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3.5">
                  <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-amber-300 leading-relaxed">
                    By submitting, you confirm that all provided details and priority claims are authentic. False
                    claims will result in cancellation of hostel allotment.
                  </p>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-light-border dark:border-dark-border">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="px-6 py-3 rounded-2xl font-bold text-sm btn btn-secondary flex items-center gap-2 disabled:opacity-40"
              >
                <ArrowLeft size={16} />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                {WIZARD_STEPS.map((s) => (
                  <div
                    key={s.id}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      s.id === step
                        ? "w-8 bg-blue-600"
                        : s.id < step
                        ? "w-3 bg-emerald-500"
                        : "w-3 bg-light-border dark:bg-dark-border"
                    }`}
                  />
                ))}
              </div>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="px-7 py-3 rounded-2xl font-bold text-sm btn btn-primary flex items-center gap-2 shadow-lg shadow-blue-600/25"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="px-8 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-600/30 flex items-center gap-2 transition-all"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : existingApp ? (
                    <>
                      <Send size={16} />
                      <span>Update & Submit Application</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HostelApplication;

