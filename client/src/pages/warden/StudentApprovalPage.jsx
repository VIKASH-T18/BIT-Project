/**
 * @file StudentApprovalPage.jsx
 * @description Warden & Admin review of student hostel applications —
 * live API integration to view, approve, reject, or waitlist applications.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck, Search, CheckCircle, X, ChevronRight,
  Clock, FileText, Users, Eye, Check, AlertTriangle,
  Loader2, GraduationCap, Phone, MapPin, Building2,
  Layers, Shield, Heart, Star, Sparkles, Filter, RefreshCw, Trash2,
  CheckSquare, Square, MinusSquare
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const STATUS_CFG = {
  pending:      { label: "Pending",      bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/30",   dot: "bg-amber-400"   },
  under_review: { label: "Under Review", bg: "bg-blue-500/15",    text: "text-blue-400",    border: "border-blue-500/30",    dot: "bg-blue-400"    },
  approved:     { label: "Approved",     bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  rejected:     { label: "Rejected",     bg: "bg-rose-500/15",    text: "text-rose-400",    border: "border-rose-500/30",    dot: "bg-rose-400"    },
  allocated:    { label: "Allocated",    bg: "bg-cyan-500/15",    text: "text-cyan-400",    border: "border-cyan-500/30",    dot: "bg-cyan-400"    },
  waitlisted:   { label: "Waitlisted",   bg: "bg-purple-500/15",  text: "text-purple-400",  border: "border-purple-500/30",  dot: "bg-purple-400"  },
};

const StatusBadge = ({ status }) => {
  const norm = (status || "pending").toLowerCase();
  const c = STATUS_CFG[norm] || STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

// ─── Review Modal ─────────────────────────────────────────────────────────────
const ReviewModal = ({ app, onClose, onAction, onDelete, isPendingAction }) => {
  const initialRemarks = (app.reviewComments || "").trim();
  const isCannedNote = initialRemarks.toLowerCase().startsWith("approved by") || initialRemarks.toLowerCase().startsWith("application approved by");
  const [remarks, setRemarks] = useState(isCannedNote ? "" : initialRemarks);
  const [actionType, setActionType] = useState(null);

  const student = app.student || {};
  const user = student.user || app.user || {};
  const normStatus = (app.status || "pending").toLowerCase();

  const handleAction = async (status) => {
    setActionType(status);
    await onAction(app._id, status, remarks);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-xl rounded-3xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={user.profileUrl || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "S")}&background=2563eb&color=fff`}
              alt={user.name}
              className="w-12 h-12 rounded-2xl object-cover border border-blue-500/20 flex-shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-bold text-base text-light-text dark:text-dark-text truncate">
                {user.name || (student.registerNumber ? `Student (${student.registerNumber})` : "Student")}
              </h3>
              <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                {student.registerNumber || "—"} • {student.department || "—"} • Year {student.year || 1}
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
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Key Application Info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
              <p className="text-[11px] text-light-muted dark:text-dark-muted">Academic Year</p>
              <p className="text-xs font-bold text-light-text dark:text-dark-text mt-0.5">{app.academicYear || "Current"}</p>
            </div>
            <div className="p-3 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
              <p className="text-[11px] text-light-muted dark:text-dark-muted">Preferred Block</p>
              <p className="text-xs font-bold text-blue-500 mt-0.5">
                {app.preferredBlock?.blockCode
                  ? `Block ${app.preferredBlock.blockCode}`
                  : (app.preferredBlock?.blockName || "Any Block")}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
              <p className="text-[11px] text-light-muted dark:text-dark-muted">Room Type</p>
              <p className="text-xs font-bold text-light-text dark:text-dark-text capitalize mt-0.5">
                {app.preferredRoomType?.replace("_", " ") || "Double"} {app.preferredAC ? "• AC" : ""}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
              <p className="text-[11px] text-light-muted dark:text-dark-muted">Priority Score</p>
              <p className="text-xs font-black text-emerald-500 mt-0.5">{app.priorityScore || 0} pts</p>
            </div>
            <div className="p-3 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
              <p className="text-[11px] text-light-muted dark:text-dark-muted">Preferred Floor</p>
              <p className="text-xs font-bold text-light-text dark:text-dark-text mt-0.5">
                {app.preferredFloor ? `Floor ${app.preferredFloor}` : "No preference"}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
              <p className="text-[11px] text-light-muted dark:text-dark-muted">AI Matching</p>
              <p className="text-xs font-bold text-purple-400 mt-0.5">
                {app.useAiMatching ? "Enabled" : "Specific Friend"}
              </p>
            </div>
          </div>

          {/* Student Contact & Location */}
          <div className="p-3.5 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-light-muted dark:text-dark-muted">Email:</span>
              <span className="font-semibold text-light-text dark:text-dark-text">{user.email || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-light-muted dark:text-dark-muted">Phone:</span>
              <span className="font-semibold text-light-text dark:text-dark-text">{student.phone || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-light-muted dark:text-dark-muted">Home Location:</span>
              <span className="font-semibold text-light-text dark:text-dark-text">
                {student.homeAddress || `${student.nativeCity || ""}, ${student.nativeState || ""}` || "Not specified"}
              </span>
            </div>
          </div>

          {/* Priority Reasons Factors */}
          {app.priorityReasons && (
            <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2">
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Priority Factors</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {app.priorityReasons.isFinalYear && (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                    🎓 Final Year (+40 pts)
                  </span>
                )}
                {app.priorityReasons.hasDisability && (
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                    ♿ Physical Disability (+30 pts)
                  </span>
                )}
                {app.priorityReasons.hasMedical && (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                    ❤️ Medical Condition (+20 pts)
                  </span>
                )}
                {app.priorityReasons.isScholarship && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                    ⭐ Scholarship (+15 pts)
                  </span>
                )}
                {app.priorityReasons.distanceKm > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    📍 {app.priorityReasons.distanceKm} km from college
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Remarks input */}
          <div>
            <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1.5 uppercase tracking-wider">
              Review Remarks / Comments (optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Add review feedback, special room instructions, or rejection reasons..."
              className="bit-input text-xs resize-none"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-light-border dark:border-dark-border flex gap-2.5">
          <button
            onClick={() => onDelete(app)}
            type="button"
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 flex items-center justify-center gap-1.5 transition-colors"
            title="Delete application"
          >
            <Trash2 size={14} /> Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-semibold text-xs btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => handleAction("rejected")}
            disabled={isPendingAction}
            className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
          >
            {isPendingAction && actionType === "rejected" ? (
              <><Loader2 size={13} className="animate-spin" /> Rejecting...</>
            ) : (
              <><X size={14} /> Reject</>
            )}
          </button>
          <button
            onClick={() => handleAction("approved")}
            disabled={isPendingAction}
            className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
          >
            {isPendingAction && actionType === "approved" ? (
              <><Loader2 size={13} className="animate-spin" /> Approving...</>
            ) : (
              <><Check size={14} /> Approve</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const StudentApprovalPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(""); // "" | "pending" | "approved" | "rejected" | "allocated"
  const [review, setReview] = useState(null);
  const [confirmDeleteApp, setConfirmDeleteApp] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  // Fetch applications from the real backend endpoint with higher limit
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["all-applications", filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      params.set("limit", "200");
      const res = await api.get(`/applications?${params.toString()}`);
      return res.data.data;
    },
    refetchInterval: 3000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/applications/${id}`);
      return res.data;
    },
    onSuccess: (_, deletedId) => {
      toast.success("Application deleted successfully!");
      setSelectedIds((prev) => prev.filter((id) => id !== deletedId));
      queryClient.invalidateQueries({ queryKey: ["all-applications"] });
      queryClient.invalidateQueries({ queryKey: ["all-students"] });
      setConfirmDeleteApp(null);
      setReview(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete application.");
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      const res = await api.post("/applications/bulk-delete", { ids });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Selected applications deleted successfully!");
      setSelectedIds([]);
      setConfirmBulkDelete(false);
      queryClient.invalidateQueries({ queryKey: ["all-applications"] });
      queryClient.invalidateQueries({ queryKey: ["all-students"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete selected applications.");
    },
  });

  const applications = data?.applications || [];
  const statusCounts = data?.statusCounts || {};

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, remarks }) => {
      const res = await api.patch(`/applications/${id}/review`, {
        status,
        reviewComments: remarks,
        rejectionReason: status === "rejected" ? remarks : undefined,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Application marked as ${variables.status}!`);
      queryClient.invalidateQueries({ queryKey: ["all-applications"] });
      queryClient.invalidateQueries({ queryKey: ["all-students"] });
      queryClient.invalidateQueries({ queryKey: ["my-allocation"] });
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      setReview(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update application.");
    },
  });

  const handleReviewAction = async (id, status, remarks) => {
    reviewMutation.mutate({ id, status, remarks });
  };

  const handleBulkApprove = async () => {
    if (!selectedIds.length) return;
    setIsBulkApproving(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          api.patch(`/applications/${id}/review`, {
            status: "approved",
            reviewComments: "Approved via bulk review",
          })
        )
      );
      toast.success(`${selectedIds.length} applications approved successfully!`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["all-applications"] });
      queryClient.invalidateQueries({ queryKey: ["all-students"] });
      queryClient.invalidateQueries({ queryKey: ["my-allocation"] });
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve selected applications.");
    } finally {
      setIsBulkApproving(false);
    }
  };

  const filtered = applications.filter((app) => {
    const s = search.toLowerCase();
    const name = (app.student?.user?.name || app.user?.name || "").toLowerCase();
    const reg = (app.student?.registerNumber || "").toLowerCase();
    const dept = (app.student?.department || "").toLowerCase();
    const block = (app.preferredBlock?.blockCode || "").toLowerCase();
    return !search || name.includes(s) || reg.includes(s) || dept.includes(s) || block.includes(s);
  });

  const isAllSelected = filtered.length > 0 && filtered.every((app) => selectedIds.includes(app._id));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      const filteredIdSet = new Set(filtered.map((a) => a._id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const newSelected = new Set(selectedIds);
      filtered.forEach((a) => newSelected.add(a._id));
      setSelectedIds(Array.from(newSelected));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const stats = [
    { label: "Total Applications", value: applications.length, color: "from-blue-500 to-indigo-600", icon: FileText },
    { label: "Pending Review", value: statusCounts.pending || 0, color: "from-amber-500 to-orange-500", icon: Clock },
    { label: "Approved", value: statusCounts.approved || 0, color: "from-emerald-500 to-green-600", icon: CheckCircle },
    { label: "Allocated", value: statusCounts.allocated || 0, color: "from-cyan-500 to-blue-500", icon: Building2 },
  ];

  // Get objects for selected IDs to display in bulk delete modal
  const selectedAppsList = applications.filter((a) => selectedIds.includes(a._id));

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-4">
        <div>
          <h1 className="text-2xl font-black font-display text-light-text dark:text-dark-text">
            Student Hostel Approvals
          </h1>
          <p className="text-light-muted dark:text-dark-muted text-sm mt-0.5">
            Review, approve, reject, or manage student hostel applications
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
            <strong>{statusCounts.pending} applications</strong> are currently awaiting review and approval.
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
              placeholder="Search by student name, register number, department, or block..."
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
              { val: "allocated", label: "Allocated" },
              { val: "rejected", label: "Rejected" },
            ].map(({ val, label }) => (
              <button
                key={label}
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

      {/* ── Sticky Floating Bulk Actions Bar ───────────── */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="sticky top-4 z-30 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-light-surface/95 dark:bg-dark-surface/95 border border-blue-500/30 backdrop-blur-md shadow-2xl shadow-blue-500/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/30">
                {selectedIds.length}
              </div>
              <div>
                <p className="text-xs font-bold text-light-text dark:text-dark-text">
                  {selectedIds.length} {selectedIds.length === 1 ? "application" : "applications"} selected
                </p>
                <p className="text-[11px] text-light-muted dark:text-dark-muted">
                  Choose an action to perform on all selected applications
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-light-muted dark:text-dark-muted hover:text-light-text hover:bg-light-elevated dark:hover:bg-dark-elevated transition-colors"
              >
                Deselect All
              </button>
              <button
                type="button"
                onClick={handleBulkApprove}
                disabled={isBulkApproving}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isBulkApproving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Approve Selected ({selectedIds.length})
              </button>
              <button
                type="button"
                onClick={() => setConfirmBulkDelete(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/30 flex items-center gap-1.5 transition-all"
              >
                <Trash2 size={13} />
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Applications List ─────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-bold font-display text-light-text dark:text-dark-text flex items-center gap-2">
            <UserCheck size={18} className="text-blue-500" />
            {isLoading ? "Loading..." : `${filtered.length} applications shown`}
          </h3>

          {filtered.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isAllSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : isSomeSelected
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                    : "bg-light-elevated dark:bg-dark-elevated text-light-muted dark:text-dark-muted hover:text-light-text border-light-border dark:border-dark-border"
                }`}
              >
                {isAllSelected ? (
                  <CheckSquare size={14} className="text-white" />
                ) : isSomeSelected ? (
                  <MinusSquare size={14} className="text-blue-400" />
                ) : (
                  <Square size={14} />
                )}
                <span>{isAllSelected ? "Deselect All" : `Select All (${filtered.length})`}</span>
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 size={32} className="animate-spin text-blue-500 mx-auto" />
            <p className="text-sm text-light-muted dark:text-dark-muted">Loading applications from server...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <GraduationCap size={36} className="text-light-muted dark:text-dark-muted mx-auto mb-2 opacity-50" />
            <p className="text-light-text dark:text-dark-text font-bold">No applications found</p>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
              {filter ? `No applications currently match the "${filter}" filter.` : "No student applications have been submitted yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {filtered.map((app) => {
              const student = app.student || {};
              const user = student.user || app.user || {};
              const normStatus = (app.status || "pending").toLowerCase();
              const isSelected = selectedIds.includes(app._id);

              return (
                <motion.div
                  key={app._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl transition-all group cursor-pointer flex items-center gap-3.5 ${
                    isSelected
                      ? "bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/40 shadow-xs"
                      : "hover:bg-light-elevated dark:hover:bg-dark-elevated border border-transparent"
                  }`}
                  onClick={() => setReview(app)}
                >
                  {/* Select Multiple Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(app._id);
                    }}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0 border ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                        : "bg-light-elevated dark:bg-dark-elevated border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:border-blue-500/50"
                    }`}
                    title={isSelected ? "Deselect" : "Select for batch deletion"}
                  >
                    {isSelected ? <Check size={13} className="stroke-[3]" /> : null}
                  </button>

                  <img
                    src={user.profileUrl || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "S")}&background=2563eb&color=fff`}
                    alt={user.name}
                    className="w-11 h-11 rounded-xl object-cover border border-light-border dark:border-dark-border flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-light-text dark:text-dark-text group-hover:text-blue-500 transition-colors">
                          {user.name || (student.registerNumber ? `Student (${student.registerNumber})` : "Student")}
                        </p>
                        {app.priorityScore > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {app.priorityScore} pts
                          </span>
                        )}
                      </div>
                      <StatusBadge status={app.status} />
                    </div>

                    <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                      {student.registerNumber || student.rollNumber || "—"} • {student.department || "—"} • Year {student.year || 1}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-light-muted dark:text-dark-muted">
                      {(app.preferredBlock?.blockCode || app.preferredBlock?.blockName) && (
                        <span className="font-bold text-blue-400">
                          {app.preferredBlock.blockCode ? `Block ${app.preferredBlock.blockCode}` : app.preferredBlock.blockName}
                        </span>
                      )}
                      <span className="capitalize">{app.preferredRoomType?.replace("_", " ")} {app.preferredAC ? "• AC" : ""}</span>
                      <span>•</span>
                      <span>Applied: {fmtDate(app.submittedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(normStatus === "pending" || normStatus === "under_review") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReviewAction(app._id, "approved", "Approved by warden/admin");
                        }}
                        disabled={reviewMutation.isPending}
                        className="px-3 py-1.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center gap-1 whitespace-nowrap transition-all"
                        title="Quick approve application"
                      >
                        <Check size={12} /> Approve
                      </button>
                    )}
                    {normStatus === "pending" || normStatus === "under_review" ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setReview(app); }}
                        className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs whitespace-nowrap"
                      >
                        <Eye size={12} /> Review
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setReview(app); }}
                        className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs whitespace-nowrap"
                      >
                        <Eye size={12} /> Details
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteApp(app);
                      }}
                      title="Delete Application"
                      className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
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
            app={review}
            onClose={() => setReview(null)}
            onAction={handleReviewAction}
            onDelete={(a) => {
              setConfirmDeleteApp(a);
            }}
            isPendingAction={reviewMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* ── Single Delete Confirmation Modal ──────────── */}
      {confirmDeleteApp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-md w-full p-6 space-y-4 border border-red-500/30 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-light-text dark:text-dark-text">Delete Application</h3>
                <p className="text-xs text-light-muted dark:text-dark-muted">
                  {confirmDeleteApp.student?.user?.name || confirmDeleteApp.user?.name || "Student"} • {confirmDeleteApp.student?.registerNumber || "—"}
                </p>
              </div>
            </div>
            <p className="text-sm text-light-muted dark:text-dark-muted leading-relaxed">
              Are you sure you want to permanently delete this hostel application (Year {confirmDeleteApp.academicYear || "2026-27"})? The student's application status will be reset.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteApp(null)}
                disabled={deleteMutation.isPending}
                className="btn btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(confirmDeleteApp._id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-all"
              >
                {deleteMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                {deleteMutation.isPending ? "Deleting..." : "Yes, Delete Application"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Bulk Delete Confirmation Modal ────────────── */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="card max-w-lg w-full p-6 space-y-4 border border-red-500/30 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-light-text dark:text-dark-text">
                  Delete {selectedIds.length} Applications?
                </h3>
                <p className="text-xs text-light-muted dark:text-dark-muted">
                  Batch deletion action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-sm text-light-muted dark:text-dark-muted leading-relaxed">
              Are you sure you want to permanently delete these <strong>{selectedIds.length} selected hostel applications</strong>? The respective students' application statuses will be reset.
            </p>

            {/* Selected Applications Preview List */}
            <div className="p-3 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border max-h-44 overflow-y-auto divide-y divide-light-border/50 dark:divide-dark-border/50">
              {selectedAppsList.map((app) => (
                <div key={app._id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-light-text dark:text-dark-text truncate">
                      {app.student?.user?.name || app.user?.name || "Student"}
                    </p>
                    <p className="text-[11px] text-light-muted dark:text-dark-muted">
                      {app.student?.registerNumber || "No Reg"} • {app.academicYear || "Current Year"}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmBulkDelete(false)}
                disabled={bulkDeleteMutation.isPending}
                className="btn btn-secondary text-xs px-4 py-2.5 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => bulkDeleteMutation.mutate(selectedIds)}
                disabled={bulkDeleteMutation.isPending}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-all"
              >
                {bulkDeleteMutation.isPending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Deleting {selectedIds.length}...
                  </>
                ) : (
                  <>
                    <Trash2 size={13} /> Yes, Delete ({selectedIds.length})
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StudentApprovalPage;
