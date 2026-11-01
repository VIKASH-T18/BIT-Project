/**
 * @file WardenLeavePage.jsx
 * @description Warden leave management — live review, approve, and reject student leave requests.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Search, CheckCircle, X, ChevronRight,
  Clock, FileText, Users, Eye, Check, AlertTriangle, Loader2,
  RefreshCw, MapPin, Phone, Shield, User
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const fmt = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const STATUS_CFG = {
  approved:  { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400", label: "Approved" },
  pending:   { bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/30",   dot: "bg-amber-400",   label: "Pending" },
  rejected:  { bg: "bg-red-500/15",     text: "text-red-400",     border: "border-red-500/30",     dot: "bg-red-400",     label: "Rejected" },
  cancelled: { bg: "bg-slate-500/15",   text: "text-slate-400",   border: "border-slate-500/30",   dot: "bg-slate-400",   label: "Cancelled" },
};

const StatusBadge = ({ status }) => {
  const norm = (status || "pending").toLowerCase();
  const c = STATUS_CFG[norm] || STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

const formatLeaveType = (type) => {
  if (!type) return "General Leave";
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// ─── Review Modal ─────────────────────────────────────────────────────────────
const ReviewModal = ({ req, onClose, onAction, isPending }) => {
  const [remarks, setRemarks] = useState(req.rejectionReason || "");
  const [actionType, setActionType] = useState(null);

  const student = req.student || {};
  const user = student.user || req.user || {};
  const studentName = user.name || (student.registerNumber ? `Student (${student.registerNumber})` : "Student");
  const regNo = student.registerNumber || "—";
  const dept = student.department || "—";
  const year = student.year || 1;
  const avatar =
    user.profileUrl ||
    user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=2563eb&color=fff`;

  const normStatus = (req.status || "pending").toLowerCase();
  const duration =
    req.noOfDays ||
    Math.max(1, Math.ceil((new Date(req.toDate) - new Date(req.fromDate)) / (1000 * 60 * 60 * 24)));

  const handleAction = async (status) => {
    setActionType(status);
    await onAction(req._id, status, remarks);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-lg rounded-2xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center gap-3">
            <img src={avatar} alt={studentName} className="w-11 h-11 rounded-xl object-cover border border-blue-500/30" />
            <div>
              <h3 className="font-bold text-base text-light-text dark:text-dark-text">{studentName}</h3>
              <p className="text-xs text-light-muted dark:text-dark-muted">
                {regNo} • {dept} • Year {year}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-light-muted hover:text-light-text hover:bg-light-elevated dark:hover:bg-dark-elevated transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
              <p className="text-[11px] text-light-muted dark:text-dark-muted">Leave Type</p>
              <p className="text-xs font-bold text-light-text dark:text-dark-text mt-0.5">{formatLeaveType(req.leaveType)}</p>
            </div>
            <div className="p-3 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
              <p className="text-[11px] text-light-muted dark:text-dark-muted">Status</p>
              <div className="mt-0.5"><StatusBadge status={req.status} /></div>
            </div>
            <div className="p-3 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
              <p className="text-[11px] text-light-muted dark:text-dark-muted">From Date</p>
              <p className="text-xs font-bold text-light-text dark:text-dark-text mt-0.5">{fmt(req.fromDate)}</p>
            </div>
            <div className="p-3 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
              <p className="text-[11px] text-light-muted dark:text-dark-muted">To Date</p>
              <p className="text-xs font-bold text-light-text dark:text-dark-text mt-0.5">{fmt(req.toDate)}</p>
            </div>
            <div className="p-3 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
              <p className="text-[11px] text-light-muted dark:text-dark-muted">Duration</p>
              <p className="text-xs font-bold text-blue-500 mt-0.5">
                {duration} {duration === 1 ? "day" : "days"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
              <p className="text-[11px] text-light-muted dark:text-dark-muted">Emergency Contact</p>
              <p className="text-xs font-bold text-light-text dark:text-dark-text mt-0.5">
                {req.emergencyPhone || student.phone || "—"}
              </p>
            </div>
          </div>

          {/* Destination */}
          <div className="p-3.5 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
            <div className="flex items-center gap-1.5 text-xs text-light-muted dark:text-dark-muted mb-1">
              <MapPin size={13} className="text-blue-500" />
              <span className="font-semibold">Destination Address</span>
            </div>
            <p className="text-xs text-light-text dark:text-dark-text font-medium">
              {req.destination || "Home / Outstation"}
            </p>
          </div>

          {/* Reason */}
          <div className="p-3.5 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
            <p className="text-xs font-semibold text-light-muted dark:text-dark-muted mb-1">Reason for Leave</p>
            <p className="text-xs text-light-text dark:text-dark-text leading-relaxed">
              {req.reason || req.remarks || "No specific reason provided."}
            </p>
          </div>

          {/* Warden Remarks */}
          {normStatus === "pending" ? (
            <div>
              <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1.5 uppercase tracking-wider">
                Warden Review Remarks (optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                placeholder="Add approval instructions or rejection reason..."
                className="bit-input text-xs resize-none"
              />
            </div>
          ) : (
            req.rejectionReason && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-xs font-semibold text-red-400 mb-0.5">Warden Remarks / Rejection Reason</p>
                <p className="text-xs text-light-text dark:text-dark-text">{req.rejectionReason}</p>
              </div>
            )
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-light-border dark:border-dark-border">
          {normStatus === "pending" ? (
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction("rejected")}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                {isPending && actionType === "rejected" ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Rejecting...
                  </>
                ) : (
                  <>
                    <X size={14} /> Reject
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleAction("approved")}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                {isPending && actionType === "approved" ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Approving...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Approve
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl font-bold text-xs btn btn-secondary"
            >
              Close
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const WardenLeavePage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("pending");
  const [review, setReview] = useState(null);

  // Live Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["warden-leaves", filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter && filter.toLowerCase() !== "all") {
        params.set("status", filter.toLowerCase());
      }
      const res = await api.get(`/leave?${params.toString()}`);
      return res.data;
    },
  });

  const requests = data?.data || [];
  const statusCounts = data?.statusCounts || {};

  // Status Action Mutation
  const actionMutation = useMutation({
    mutationFn: async ({ id, status, remarks }) => {
      const res = await api.patch(`/leave/${id}/status`, { status, remarks });
      return res.data;
    },
    onSuccess: (_, vars) => {
      toast.success(`Leave request ${vars.status === "approved" ? "Approved" : "Rejected"} successfully!`);
      queryClient.invalidateQueries({ queryKey: ["warden-leaves"] });
      queryClient.invalidateQueries({ queryKey: ["warden-dashboard"] });
      setReview(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update leave request.");
    },
  });

  const handleAction = (id, action, remarks) => {
    actionMutation.mutate({
      id,
      status: action.toLowerCase(),
      remarks,
    });
  };

  const filtered = requests.filter((r) => {
    const s = search.toLowerCase();
    const student = r.student || {};
    const user = student.user || r.user || {};
    const name = (user.name || "").toLowerCase();
    const reg = (student.registerNumber || "").toLowerCase();
    const type = (r.leaveType || "").toLowerCase();
    const dest = (r.destination || "").toLowerCase();
    const reason = (r.reason || "").toLowerCase();

    return !search || name.includes(s) || reg.includes(s) || type.includes(s) || dest.includes(s) || reason.includes(s);
  });

  const stats = [
    { label: "Total Requests", value: statusCounts.total || requests.length, color: "from-blue-500 to-indigo-600", icon: FileText },
    { label: "Pending", value: statusCounts.pending || 0, color: "from-amber-500 to-orange-500", icon: Clock },
    { label: "Approved", value: statusCounts.approved || 0, color: "from-emerald-500 to-green-600", icon: CheckCircle },
    { label: "Rejected", value: statusCounts.rejected || 0, color: "from-red-500 to-rose-600", icon: X },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-4">
        <div>
          <h1 className="text-2xl font-black font-display text-light-text dark:text-dark-text">
            Leave & Outpass Management
          </h1>
          <p className="text-light-muted dark:text-dark-muted text-sm mt-0.5">
            Review, approve, or reject student hostel leave applications
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="btn btn-secondary btn-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* ── Stats Summary Cards ──────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-4">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <Icon size={16} className="text-white" />
              </div>
              <p className="text-2xl font-black font-display text-light-text dark:text-dark-text">{s.value}</p>
              <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Pending Alert Banner ──────────────────────── */}
      {(statusCounts.pending || 0) > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            <strong>{statusCounts.pending} student leave requests</strong> are awaiting your review and approval.
          </p>
        </div>
      )}

      {/* ── Filters & Search ──────────────────────────── */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
            <input
              type="text"
              placeholder="Search by student name, register number, leave type, or destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bit-input pl-8"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { val: "all", label: "All" },
              { val: "pending", label: `Pending (${statusCounts.pending || 0})` },
              { val: "approved", label: `Approved (${statusCounts.approved || 0})` },
              { val: "rejected", label: `Rejected (${statusCounts.rejected || 0})` },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === val
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-light-elevated dark:bg-dark-elevated text-light-muted hover:text-light-text border border-light-border dark:border-dark-border"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Requests List ─────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold font-display text-light-text dark:text-dark-text flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            {isLoading ? "Loading..." : `${filtered.length} leave requests shown`}
          </h3>
        </div>

        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 size={32} className="animate-spin text-blue-500 mx-auto" />
            <p className="text-sm text-light-muted dark:text-dark-muted">Loading leave requests from server...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar size={36} className="text-light-muted dark:text-dark-muted mx-auto mb-2 opacity-50" />
            <p className="text-light-text dark:text-dark-text font-bold">No leave requests found</p>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
              {filter !== "all"
                ? `No requests currently match the "${filter}" filter.`
                : "No student leave applications have been submitted yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {filtered.map((req) => {
              const student = req.student || {};
              const user = student.user || req.user || {};
              const studentName = user.name || (student.registerNumber ? `Student (${student.registerNumber})` : "Student");
              const regNo = student.registerNumber || "—";
              const dept = student.department || "—";
              const year = student.year || 1;
              const avatar =
                user.profileUrl ||
                user.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=2563eb&color=fff`;

              const normStatus = (req.status || "pending").toLowerCase();
              const duration =
                req.noOfDays ||
                Math.max(1, Math.ceil((new Date(req.toDate) - new Date(req.fromDate)) / (1000 * 60 * 60 * 24)));

              return (
                <motion.div
                  key={req._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 hover:bg-light-elevated dark:hover:bg-dark-elevated rounded-xl transition-all group cursor-pointer flex items-center gap-4"
                  onClick={() => setReview(req)}
                >
                  <img
                    src={avatar}
                    alt={studentName}
                    className="w-11 h-11 rounded-xl object-cover border border-light-border dark:border-dark-border flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-light-text dark:text-dark-text group-hover:text-blue-500 transition-colors">
                          {studentName}
                        </p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {formatLeaveType(req.leaveType)}
                        </span>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>

                    <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                      {regNo} • {dept} • Year {year}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-light-muted dark:text-dark-muted">
                      <span>
                        📅 {fmtDate(req.fromDate)} → {fmtDate(req.toDate)} ({duration} {duration === 1 ? "day" : "days"})
                      </span>
                      <span>•</span>
                      <span className="truncate max-w-[200px]">📍 {req.destination || "Home"}</span>
                      {req.reason && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[240px] italic">"{req.reason}"</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {normStatus === "pending" ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(req._id, "approved");
                          }}
                          disabled={actionMutation.isPending}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 transition-colors flex items-center gap-1"
                          title="Quick Approve"
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReview(req);
                          }}
                          className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs whitespace-nowrap"
                        >
                          <Eye size={12} /> Review
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReview(req);
                        }}
                        className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs whitespace-nowrap"
                      >
                        <Eye size={12} /> Details
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Review Modal ──────────────────────────────── */}
      <AnimatePresence>
        {review && (
          <ReviewModal
            req={review}
            onClose={() => setReview(null)}
            onAction={handleAction}
            isPending={actionMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WardenLeavePage;