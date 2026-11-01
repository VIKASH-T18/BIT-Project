/**
 * @file WardenComplaintsPage.jsx
 * @description Warden complaints management — live data from backend,
 * view, respond to, and resolve student maintenance complaints.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Search, CheckCircle, X, Clock,
  MessageSquare, Wrench, Zap, Droplets, Loader2,
  Send, Eye, ThumbsUp, Wifi, Sparkles, Bed, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_MAP = {
  internet:    { label: "Wi-Fi & Internet",  Icon: Wifi,        color: "from-blue-500 to-indigo-600" },
  electricity: { label: "Electricity",        Icon: Zap,         color: "from-amber-500 to-orange-500" },
  water:       { label: "Plumbing / Water",   Icon: Droplets,    color: "from-cyan-500 to-blue-500"   },
  cleanliness: { label: "Cleanliness",        Icon: Sparkles,    color: "from-emerald-500 to-teal-500"},
  furniture:   { label: "Furniture & Bed",    Icon: Bed,         color: "from-purple-500 to-violet-600"},
  maintenance: { label: "General Repair",     Icon: Wrench,      color: "from-slate-500 to-gray-600"  },
  food:        { label: "Mess / Food",        Icon: AlertTriangle, color: "from-orange-500 to-red-500" },
  security:    { label: "Security",           Icon: AlertTriangle, color: "from-red-600 to-rose-600"   },
  noise:       { label: "Noise Complaint",    Icon: MessageSquare, color: "from-pink-500 to-rose-500"  },
  others:      { label: "Others",             Icon: AlertTriangle, color: "from-gray-500 to-slate-500" },
};

// Backend statuses → display labels
const STATUS_LABELS = {
  pending:     "Pending",
  assigned:    "Assigned",
  in_progress: "In Progress",
  resolved:    "Resolved",
  rejected:    "Rejected",
  closed:      "Closed",
};

const STATUS_CFG = {
  pending:     { bg: "bg-amber-500/20",   text: "text-amber-400",   border: "border-amber-500/30",   dot: "bg-amber-400"   },
  assigned:    { bg: "bg-blue-500/20",    text: "text-blue-400",    border: "border-blue-500/30",    dot: "bg-blue-400"    },
  in_progress: { bg: "bg-violet-500/20",  text: "text-violet-400",  border: "border-violet-500/30",  dot: "bg-violet-400"  },
  resolved:    { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  rejected:    { bg: "bg-red-500/20",     text: "text-red-400",     border: "border-red-500/30",     dot: "bg-red-400"     },
  closed:      { bg: "bg-slate-500/20",   text: "text-slate-400",   border: "border-slate-500/30",   dot: "bg-slate-400"   },
};

const PRIORITY_CFG = {
  urgent: { bg: "bg-red-500/20",    text: "text-red-400",    border: "border-red-500/30"    },
  high:   { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  medium: { bg: "bg-amber-500/20",  text: "text-amber-400",  border: "border-amber-500/30"  },
  low:    { bg: "bg-blue-500/20",   text: "text-blue-400",   border: "border-blue-500/30"   },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {STATUS_LABELS[status] || status}
    </span>
  );
};

// ─── Detail / Response Modal ──────────────────────────────────────────────────
const ComplaintModal = ({ complaint, onClose, onUpdate }) => {
  const [resolutionNote, setResolutionNote] = useState(complaint.resolutionNote || "");
  const [status, setStatus] = useState(complaint.status || "pending");
  const cat = CATEGORY_MAP[complaint.type] || CATEGORY_MAP.maintenance;
  const { Icon: CatIcon } = cat;
  const pc = PRIORITY_CFG[complaint.priority] || PRIORITY_CFG.medium;
  const studentName = complaint.student?.user?.name || "Hostel Resident";
  const regNo       = complaint.student?.registerNumber || "—";
  const dept        = complaint.student?.department || "—";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        className="w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(145deg,#1a1f2e,#141824)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
              <CatIcon size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">{complaint.title}</h3>
              <p className="text-xs text-slate-400">
                {cat.label} • {complaint.complaintNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Student Info */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{studentName}</p>
              <p className="text-xs text-slate-400">{regNo} • {dept}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-md border font-semibold ${pc.bg} ${pc.text} ${pc.border}`}>
              {complaint.priority}
            </span>
          </div>

          {/* Description */}
          <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-xs text-slate-500 mb-1">Student Description</p>
            <p className="text-sm text-white leading-relaxed">{complaint.description}</p>
            <p className="text-xs text-slate-500 mt-2">Filed: {fmtDate(complaint.createdAt)}</p>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Update Status</label>
            <div className="grid grid-cols-3 gap-2">
              {["pending", "in_progress", "resolved", "assigned", "rejected", "closed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    status === s ? "text-white border-transparent" : "text-slate-400 border-white/10 hover:bg-white/5"
                  }`}
                  style={status === s ? { background: "linear-gradient(135deg,#7c3aed,#6d28d9)" } : {}}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution Note */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Resolution / Action Note</label>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              rows={3}
              placeholder="Describe the action taken or resolution applied..."
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 outline-none focus:border-violet-500/60 transition-colors resize-none"
              style={{ background: "#0d111c" }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-slate-300 border border-white/10 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onUpdate(complaint._id, status, resolutionNote)}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#059669,#047857)" }}
          >
            <Send size={15} /> Save Response
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const WardenComplaintsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("");
  const [selected, setSelected] = useState(null);

  // ── Fetch all complaints from backend ──────────────────────────────────────
  const { data: complaints = [], isLoading, refetch } = useQuery({
    queryKey: ["warden-complaints", filter],
    queryFn: async () => {
      const params = {};
      if (filter) params.status = filter;
      const { data } = await api.get("/complaints", { params });
      return data.data || [];
    },
    refetchInterval: 30000,
  });

  // ── Update complaint status + note ─────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async ({ id, status, resolutionNote }) => {
      const { data } = await api.patch(`/complaints/${id}/status`, { status, resolutionNote });
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success(`Complaint updated to "${STATUS_LABELS[vars.status] || vars.status}"`);
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["warden-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["warden-dashboard"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update complaint.");
    },
  });

  const handleUpdate = (id, status, resolutionNote) => {
    updateMutation.mutate({ id, status, resolutionNote });
  };

  // ── Client-side search filter ──────────────────────────────────────────────
  const filtered = complaints.filter((c) => {
    const studentName = c.student?.user?.name || "";
    const matchSearch =
      !search ||
      studentName.toLowerCase().includes(search.toLowerCase()) ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.type?.toLowerCase().includes(search.toLowerCase()) ||
      c.complaintNumber?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // ── KPI counts ─────────────────────────────────────────────────────────────
  const stats = [
    { label: "Total",       value: complaints.length,                                                             color: "from-blue-500 to-indigo-600",   icon: MessageSquare },
    { label: "Pending",     value: complaints.filter((c) => c.status === "pending").length,                       color: "from-amber-500 to-orange-500",  icon: AlertTriangle },
    { label: "In Progress", value: complaints.filter((c) => ["assigned","in_progress"].includes(c.status)).length, color: "from-violet-500 to-purple-600", icon: Clock         },
    { label: "Resolved",    value: complaints.filter((c) => ["resolved","closed"].includes(c.status)).length,     color: "from-emerald-500 to-green-600", icon: CheckCircle   },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 min-h-screen pb-10"
      style={{ background: "linear-gradient(145deg,#0f1320,#0d111c)", padding: "1.5rem", borderRadius: "1.25rem" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25">
              Hostel Maintenance
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Student Complaints</h1>
          <p className="text-slate-400 text-sm mt-0.5">Review, assign, and resolve student maintenance tickets</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-colors"
          title="Refresh complaints"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-2xl border border-white/8"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <Icon size={16} className="text-white" />
              </div>
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Alert Banner for pending */}
      {complaints.filter((c) => c.status === "pending").length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-500/30" style={{ background: "rgba(245,158,11,0.08)" }}>
          <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            <strong>{complaints.filter((c) => c.status === "pending").length} complaints</strong> are pending your review.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by student, title, type, or ticket ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white border border-white/10 outline-none focus:border-violet-500/60 transition-colors"
            style={{ background: "#0d111c" }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "",            label: "All" },
            { key: "pending",     label: "Pending" },
            { key: "in_progress", label: "In Progress" },
            { key: "resolved",    label: "Resolved" },
            { key: "closed",      label: "Closed" },
          ].map(({ key, label }) => (
            <button
              key={key || "all"}
              onClick={() => setFilter(key)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                filter === key ? "text-white shadow-lg" : "text-slate-400 border border-white/10 hover:bg-white/5"
              }`}
              style={filter === key ? { background: "linear-gradient(135deg,#7c3aed,#6d28d9)" } : {}}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Complaint Cards */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500 space-y-3">
          <Loader2 size={32} className="animate-spin text-violet-500 mx-auto" />
          <p className="text-sm font-semibold">Loading complaints...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
          <ThumbsUp size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No complaints found</p>
          <p className="text-xs text-slate-600 mt-1">
            {filter ? `No ${STATUS_LABELS[filter] || filter} complaints at this time.` : "All clear — no student complaints logged yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, i) => {
            const cat = CATEGORY_MAP[c.type] || CATEGORY_MAP.maintenance;
            const { Icon: CatIcon } = cat;
            const pc = PRIORITY_CFG[c.priority] || PRIORITY_CFG.medium;
            const studentName = c.student?.user?.name || "Hostel Resident";
            const regNo = c.student?.registerNumber || "";

            return (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-4 rounded-2xl border border-white/8 group cursor-pointer hover:border-white/15 transition-all"
                style={{ background: "rgba(255,255,255,0.04)" }}
                onClick={() => setSelected(c)}
              >
                <div className="flex items-start gap-4">
                  {/* Category Icon */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center flex-shrink-0`}>
                    <CatIcon size={16} className="text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white text-sm truncate">{c.title}</p>
                          <span className="text-[10px] font-mono text-slate-500">{c.complaintNumber}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {studentName}{regNo ? ` • ${regNo}` : ""} • {cat.label}
                          {c.room?.roomNumber ? ` • Room ${c.room.roomNumber}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-md border font-semibold ${pc.bg} ${pc.text} ${pc.border}`}>
                          {c.priority}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-1">{c.description}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Filed: {fmtDate(c.createdAt)}
                      {c.resolvedAt ? ` • Resolved: ${fmtDate(c.resolvedAt)}` : ""}
                    </p>
                  </div>

                  {/* CTA Button */}
                  <div className="flex-shrink-0">
                    {!["resolved", "closed"].includes(c.status) ? (
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-all"
                        style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}
                        onClick={(e) => { e.stopPropagation(); setSelected(c); }}
                      >
                        <Eye size={12} /> Respond
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle size={13} /> Done
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <ComplaintModal
            complaint={selected}
            onClose={() => setSelected(null)}
            onUpdate={handleUpdate}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WardenComplaintsPage;
