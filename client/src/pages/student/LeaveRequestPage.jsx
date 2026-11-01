/**
 * @file LeaveRequestPage.jsx
 * @description Student leave request management — apply, track, and view approval status.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Plus, X, Search, Clock, CheckCircle,
  ChevronRight, FileText, Loader2, MapPin, Phone,
  AlertTriangle, RefreshCw, Trash2, Check, Shield
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

const LeaveDetailModal = ({ leave, onClose, onCancel, isCancelling }) => {
  const normStatus = (leave.status || "pending").toLowerCase();
  const duration =
    leave.noOfDays ||
    Math.max(1, Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000 * 60 * 60 * 24)));

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
        className="w-full max-w-xl rounded-3xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-light-border dark:border-dark-border flex-shrink-0">
          <div>
            <h3 className="font-bold text-lg text-light-text dark:text-dark-text">
              Leave Request Details
            </h3>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
              {leave.leaveNumber || "LVR-Record"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-light-muted hover:text-light-text hover:bg-light-elevated dark:hover:bg-dark-elevated transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-4 max-h-[70vh] overflow-y-auto flex-1">
          {/* Key details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border min-h-[76px] h-full flex flex-col justify-between">
              <p className="text-xs text-light-muted dark:text-dark-muted">Leave Type</p>
              <p className="text-sm font-bold text-light-text dark:text-dark-text mt-1">
                {formatLeaveType(leave.leaveType)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border min-h-[76px] h-full flex flex-col justify-between">
              <p className="text-xs text-light-muted dark:text-dark-muted">Approval Status</p>
              <div className="mt-1"><StatusBadge status={leave.status} /></div>
            </div>
            <div className="p-4 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border min-h-[76px] h-full flex flex-col justify-between">
              <p className="text-xs text-light-muted dark:text-dark-muted">From Date</p>
              <p className="text-sm font-bold text-light-text dark:text-dark-text mt-1">
                {fmt(leave.fromDate)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border min-h-[76px] h-full flex flex-col justify-between">
              <p className="text-xs text-light-muted dark:text-dark-muted">To Date</p>
              <p className="text-sm font-bold text-light-text dark:text-dark-text mt-1">
                {fmt(leave.toDate)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border min-h-[76px] h-full flex flex-col justify-between">
              <p className="text-xs text-light-muted dark:text-dark-muted">Duration</p>
              <p className="text-sm font-bold text-blue-500 mt-1">
                {duration} {duration === 1 ? "day" : "days"}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border min-h-[76px] h-full flex flex-col justify-between">
              <p className="text-xs text-light-muted dark:text-dark-muted">Emergency Phone</p>
              <p className="text-sm font-bold text-light-text dark:text-dark-text mt-1">
                {leave.emergencyPhone || "Not specified"}
              </p>
            </div>
          </div>

          {/* Destination */}
          <div className="p-4 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
            <p className="text-xs font-semibold text-light-muted dark:text-dark-muted mb-1.5 flex items-center gap-1.5">
              <MapPin size={13} className="text-blue-500" /> Destination Address
            </p>
            <p className="text-sm text-light-text dark:text-dark-text font-medium">
              {leave.destination || "Home / Outstation"}
            </p>
          </div>

          {/* Reason */}
          <div className="p-4 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
            <p className="text-xs font-semibold text-light-muted dark:text-dark-muted mb-1.5">Reason for Leave</p>
            <p className="text-sm text-light-text dark:text-dark-text leading-relaxed">
              {leave.reason || leave.remarks || "Personal leave"}
            </p>
          </div>

          {/* Review comments */}
          {leave.rejectionReason && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-xs font-semibold text-red-400 mb-1">Warden Remarks</p>
              <p className="text-sm text-light-text dark:text-dark-text">{leave.rejectionReason}</p>
            </div>
          )}

          {leave.approvedBy && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs font-semibold text-emerald-400 mb-1">Approved By</p>
              <p className="text-sm text-light-text dark:text-dark-text">
                {leave.approvedBy.name || "Hostel Warden"} on {fmt(leave.approvedAt)}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 sm:px-8 py-4.5 border-t border-light-border dark:border-dark-border flex items-center justify-end gap-3 flex-shrink-0 bg-light-elevated/20 dark:bg-dark-elevated/20">
          {normStatus === "pending" && (
            <button
              type="button"
              onClick={() => onCancel(leave._id)}
              disabled={isCancelling}
              className="h-11 px-5 rounded-xl font-bold text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 flex items-center justify-center gap-1.5 transition-colors"
            >
              {isCancelling ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              <span>Cancel Request</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 rounded-xl font-semibold text-sm btn btn-secondary flex items-center justify-center"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ApplyLeaveModal = ({ onClose, onSubmit, isSubmitting }) => {
  const [form, setForm] = useState({
    leaveType: "home_visit",
    fromDate: "",
    toDate: "",
    destination: "",
    reason: "",
    emergencyPhone: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.leaveType || !form.fromDate || !form.toDate) {
      toast.error("Please fill all required fields");
      return;
    }
    if (new Date(form.toDate) < new Date(form.fromDate)) {
      toast.error("To Date must be after From Date");
      return;
    }
    onSubmit(form);
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
        className="w-full max-w-xl rounded-3xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-light-border dark:border-dark-border flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-600 text-white shadow-md flex-shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-light-text dark:text-dark-text">Apply for Hostel Leave</h3>
              <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">Submitted to Warden for approval</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-light-muted hover:text-light-text hover:bg-light-elevated dark:hover:bg-dark-elevated transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 sm:p-8 space-y-5 overflow-y-auto flex-1">
            <div>
              <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-2 uppercase tracking-wider">
                Leave Type <span className="text-red-400">*</span>
              </label>
              <select
                value={form.leaveType}
                onChange={(e) => set("leaveType", e.target.value)}
                className="w-full h-11 px-4 rounded-xl bit-input text-sm"
                required
              >
                <option value="home_visit">Home Visit</option>
                <option value="medical">Medical / Sick Leave</option>
                <option value="educational">OnDuty / Educational / Placement</option>
                <option value="emergency">Emergency</option>
                <option value="personal">Personal / Outing</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-2 uppercase tracking-wider">
                  From Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.fromDate}
                  onChange={(e) => set("fromDate", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bit-input text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-2 uppercase tracking-wider">
                  To Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.toDate}
                  min={form.fromDate}
                  onChange={(e) => set("toDate", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bit-input text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-2 uppercase tracking-wider">
                Destination City / Address <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Home address in Coimbatore / Bangalore"
                value={form.destination}
                onChange={(e) => set("destination", e.target.value)}
                className="w-full h-11 px-4 rounded-xl bit-input text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-2 uppercase tracking-wider">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                placeholder="e.g., +91 98765 43210"
                value={form.emergencyPhone}
                onChange={(e) => set("emergencyPhone", e.target.value)}
                className="w-full h-11 px-4 rounded-xl bit-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-2 uppercase tracking-wider">
                Reason / Remarks <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.reason}
                onChange={(e) => set("reason", e.target.value)}
                rows={3}
                placeholder="Explain the purpose of your leave..."
                className="w-full p-4 rounded-xl bit-input text-sm resize-none"
                required
              />
            </div>
          </div>

          <div className="px-6 sm:px-8 py-4.5 border-t border-light-border dark:border-dark-border flex items-center justify-end gap-3 flex-shrink-0 bg-light-elevated/20 dark:bg-dark-elevated/20">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-6 rounded-xl font-semibold text-sm btn btn-secondary flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-11 px-7 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                "Submit Leave Request"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const LeaveRequestPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showApply, setShowApply] = useState(false);
  const [detail, setDetail] = useState(null);

  // Live Query
  const { data: leaves = [], isLoading, refetch } = useQuery({
    queryKey: ["my-leaves"],
    queryFn: async () => {
      const res = await api.get("/leave/my");
      return res.data?.data || [];
    },
  });

  // Apply Leave Mutation
  const applyMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/leave", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Leave application submitted successfully for Warden review!");
      queryClient.invalidateQueries({ queryKey: ["my-leaves"] });
      queryClient.invalidateQueries({ queryKey: ["warden-leaves"] });
      queryClient.invalidateQueries({ queryKey: ["warden-dashboard"] });
      setShowApply(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to submit leave application.");
    },
  });

  // Cancel / Delete Mutation
  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/leave/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Leave request cancelled successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-leaves"] });
      queryClient.invalidateQueries({ queryKey: ["warden-leaves"] });
      queryClient.invalidateQueries({ queryKey: ["warden-dashboard"] });
      setDetail(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to cancel leave request.");
    },
  });

  const filtered = leaves.filter((l) => {
    const s = search.toLowerCase();
    const type = (l.leaveType || "").toLowerCase();
    const reason = (l.reason || l.remarks || "").toLowerCase();
    const dest = (l.destination || "").toLowerCase();
    const ms = !search || type.includes(s) || reason.includes(s) || dest.includes(s);
    const mf = !filterStatus || (l.status || "").toLowerCase() === filterStatus.toLowerCase();
    return ms && mf;
  });

  const stats = [
    { label: "Total Requests", value: leaves.length, color: "from-blue-500 to-indigo-600", icon: FileText },
    { label: "Pending", value: leaves.filter((l) => l.status === "pending").length, color: "from-amber-500 to-orange-500", icon: Clock },
    { label: "Approved", value: leaves.filter((l) => l.status === "approved").length, color: "from-emerald-500 to-green-600", icon: CheckCircle },
    { label: "Rejected", value: leaves.filter((l) => l.status === "rejected").length, color: "from-red-500 to-rose-600", icon: X },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-4">
        <div>
          <h1 className="text-2xl font-black font-display text-light-text dark:text-dark-text">
            My Hostel Leaves & Outpasses
          </h1>
          <p className="text-light-muted dark:text-dark-muted text-sm mt-0.5">
            Apply for leave, track warden approvals, and view gate pass details
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => refetch()}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            onClick={() => setShowApply(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md"
          >
            <Plus size={14} /> Apply Leave
          </button>
        </div>
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

      {/* ── Filters & Search ──────────────────────────── */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
            <input
              type="text"
              placeholder="Search by leave type, destination, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bit-input pl-8"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { val: "", label: "All" },
              { val: "pending", label: "Pending" },
              { val: "approved", label: "Approved" },
              { val: "rejected", label: "Rejected" },
            ].map(({ val, label }) => (
              <button
                key={label}
                onClick={() => setFilterStatus(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterStatus === val
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
            <p className="text-sm text-light-muted dark:text-dark-muted">Loading your leave requests...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar size={36} className="text-light-muted dark:text-dark-muted mx-auto mb-2 opacity-50" />
            <p className="text-light-text dark:text-dark-text font-bold">No leave requests found</p>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
              {filterStatus ? `No leaves match the "${filterStatus}" filter.` : "You haven't submitted any leave requests yet."}
            </p>
            <button
              onClick={() => setShowApply(true)}
              className="btn btn-primary btn-sm inline-flex items-center gap-1.5 mt-4"
            >
              <Plus size={14} /> Apply for Leave
            </button>
          </div>
        ) : (
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {filtered.map((leave) => {
              const duration =
                leave.noOfDays ||
                Math.max(1, Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000 * 60 * 60 * 24)));

              return (
                <motion.div
                  key={leave._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 hover:bg-light-elevated dark:hover:bg-dark-elevated rounded-xl transition-all group cursor-pointer flex items-center gap-4"
                  onClick={() => setDetail(leave)}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center flex-shrink-0">
                    <Calendar size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-light-text dark:text-dark-text group-hover:text-blue-500 transition-colors">
                          {formatLeaveType(leave.leaveType)}
                        </p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {duration} {duration === 1 ? "day" : "days"}
                        </span>
                      </div>
                      <StatusBadge status={leave.status} />
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-light-muted dark:text-dark-muted">
                      <span>📅 {fmtDate(leave.fromDate)} → {fmtDate(leave.toDate)}</span>
                      <span>•</span>
                      <span className="truncate max-w-[200px]">📍 {leave.destination || "Home"}</span>
                      {leave.reason && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[240px] italic">"{leave.reason}"</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetail(leave);
                      }}
                      className="btn btn-secondary btn-sm text-xs"
                    >
                      View Details
                    </button>
                    <ChevronRight size={14} className="text-light-muted group-hover:text-blue-500 transition-colors" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────── */}
      <AnimatePresence>
        {showApply && (
          <ApplyLeaveModal
            onClose={() => setShowApply(false)}
            onSubmit={(payload) => applyMutation.mutate(payload)}
            isSubmitting={applyMutation.isPending}
          />
        )}
        {detail && (
          <LeaveDetailModal
            leave={detail}
            onClose={() => setDetail(null)}
            onCancel={(id) => cancelMutation.mutate(id)}
            isCancelling={cancelMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeaveRequestPage;