/**
 * @file VisitorManagementPage.jsx
 * @description Warden visitor pass management — review, approve, check-in, and track
 * student visitor entry gate passes.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, CheckCircle, X, ChevronRight,
  Clock, Eye, Check, AlertTriangle, Loader2,
  Calendar, Phone, UserCircle, MapPin, Shield,
  QrCode, ArrowRight, CheckSquare, LogIn, LogOut
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const STATUS_CFG = {
  Approved:    { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  Pending:     { bg: "bg-amber-500/20",   text: "text-amber-400",   border: "border-amber-500/30",   dot: "bg-amber-400"   },
  Rejected:    { bg: "bg-red-500/20",     text: "text-red-400",     border: "border-red-500/30",     dot: "bg-red-400"     },
  Checked_in:  { bg: "bg-cyan-500/20",    text: "text-cyan-400",    border: "border-cyan-500/30",    dot: "bg-cyan-400"    },
  Checked_out: { bg: "bg-blue-500/20",    text: "text-blue-400",    border: "border-blue-500/30",    dot: "bg-blue-400"    },
  Completed:   { bg: "bg-blue-500/20",    text: "text-blue-400",    border: "border-blue-500/30",    dot: "bg-blue-400"    },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.Pending;
  const label = status === "Checked_in" ? "Checked In" : status === "Checked_out" ? "Checked Out" : status;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{label}
    </span>
  );
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

// ─── Review / Gate Clearance Modal ───────────────────────────────────────────
const ReviewModal = ({ visitor, onClose, onAction }) => {
  const [remarks, setRemarks] = useState(visitor.wardenRemarks || "");
  const [loading, setLoading] = useState(null);

  const handleAction = async (action) => {
    setLoading(action);
    await onAction(visitor._id, action, remarks);
    setLoading(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 24 }}
        className="w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(145deg,#1a1f2e,#141824)" }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold">
              {visitor.studentName?.charAt(0) || "S"}
            </div>
            <div>
              <h3 className="font-bold text-white">{visitor.studentName}</h3>
              <p className="text-xs text-slate-400">{visitor.registerNo} • {visitor.department} • Room {visitor.room}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Visitor Pass Header Info */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Pass Number</span>
              <p className="font-mono text-sm font-bold text-white">{visitor.visitorNumber}</p>
            </div>
            <StatusBadge status={visitor.status} />
          </div>

          {/* Visitor Details */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: "Visitor Name",   v: visitor.visitorName },
              { l: "Relationship",   v: visitor.relation },
              { l: "Contact Phone",  v: visitor.visitorPhone },
              { l: "Date of Visit",  v: visitor.visitDate },
              { l: "Permitted Window", v: visitor.visitTime },
              { l: "ID Verification",  v: `${visitor.idProofType} ${visitor.idProofNumber ? `(${visitor.idProofNumber})` : ""}` },
            ].map(({ l, v }) => (
              <div key={l} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-xs text-slate-500 mb-1">{l}</p>
                <p className="text-sm text-white font-medium">{v}</p>
              </div>
            ))}
          </div>

          {/* Purpose */}
          <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-xs text-slate-500 mb-1">Purpose of Visit</p>
            <p className="text-sm text-white">{visitor.purpose}</p>
          </div>

          {/* Warden Remarks input */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Warden Remarks / Security Notes</label>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2}
              placeholder="Add verification notes or gate escort requirements..."
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 outline-none focus:border-violet-500/60 transition-colors resize-none"
              style={{ background: "#0d111c" }} />
          </div>
        </div>

        {/* Context-aware Actions */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2.5 flex-wrap">
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-300 border border-white/10 hover:bg-white/5 transition-colors">
              Cancel
            </button>

            {visitor.status === "Pending" && (
              <>
                <button onClick={() => handleAction("Rejected")} disabled={!!loading}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}>
                  {loading === "Rejected" ? <><Loader2 size={15} className="animate-spin" />Rejecting...</> : <><X size={15} />Reject</>}
                </button>
                <button onClick={() => handleAction("Approved")} disabled={!!loading}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>
                  {loading === "Approved" ? <><Loader2 size={15} className="animate-spin" />Approving...</> : <><Check size={15} />Approve</>}
                </button>
              </>
            )}

            {visitor.status === "Approved" && (
              <>
                <button onClick={() => handleAction("Rejected")} disabled={!!loading}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5 bg-red-600/80 hover:bg-red-600 transition-colors">
                  <X size={15} />Revoke
                </button>
                <button onClick={() => handleAction("Checked_in")} disabled={!!loading}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-md">
                  {loading === "Checked_in" ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
                  <span>Mark Checked In (Gate 1)</span>
                </button>
              </>
            )}

            {visitor.status === "Checked_in" && (
              <button onClick={() => handleAction("Checked_out")} disabled={!!loading}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 transition-colors shadow-md">
                {loading === "Checked_out" ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
                <span>Mark Checked Out (Exit)</span>
              </button>
            )}

            {(visitor.status === "Rejected" || visitor.status === "Checked_out" || visitor.status === "Completed") && (
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#6d28d9,#7c3aed)" }}>
                Close
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const VisitorManagementPage = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // Default to "" ("All") so warden immediately sees all visitor passes!
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/visitors");
      const mapped = (data.data || []).map((v) => ({
        _id: v._id,
        raw: v,
        visitorNumber: v.visitorNumber || `VIS-${v._id.slice(-4)}`,
        studentName: v.student?.user?.name || "Student",
        registerNo: v.student?.registerNumber || "REG-BIT",
        department: v.student?.department || "General",
        room: v.student?.room || "Block A",
        visitorName: v.name || v.visitorName || "Guest",
        relation: v.relationship || v.relation || "Parent",
        visitorPhone: v.phone || v.visitorPhone || "—",
        visitDate: fmtDate(v.visitDate),
        visitTime: `${v.expectedTimeIn || "10:00 AM"} - ${v.expectedTimeOut || "04:00 PM"}`,
        purpose: v.purpose || v.visitPurpose || "Campus Visit",
        idProofType: v.idProofType || "Aadhaar",
        idProofNumber: v.idProofNumber || "",
        status: (v.status || "approved").charAt(0).toUpperCase() + (v.status || "approved").slice(1).toLowerCase(),
        wardenRemarks: v.wardenRemarks || "",
      }));
      setVisitors(mapped);
    } catch (error) {
      toast.error("Failed to load visitor requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const filtered = visitors.filter(v => {
    const ms = !search ||
      v.studentName.toLowerCase().includes(search.toLowerCase()) ||
      v.visitorName.toLowerCase().includes(search.toLowerCase()) ||
      v.visitorNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.registerNo.toLowerCase().includes(search.toLowerCase());
    const mf = !filter || v.status.toLowerCase() === filter.toLowerCase();
    return ms && mf;
  });

  const stats = [
    { label: "Total Passes", value: visitors.length,                                                               color: "from-blue-500 to-indigo-600",   icon: Users       },
    { label: "Pending",      value: visitors.filter(v => v.status.toLowerCase() === "pending").length,             color: "from-amber-500 to-orange-500",  icon: Clock       },
    { label: "Approved",     value: visitors.filter(v => v.status.toLowerCase() === "approved").length,            color: "from-emerald-500 to-green-600", icon: CheckCircle },
    { label: "Checked In",   value: visitors.filter(v => v.status.toLowerCase() === "checked_in").length,         color: "from-cyan-500 to-blue-600",     icon: QrCode      },
  ];

  const handleAction = async (id, action, remarks) => {
    try {
      await api.patch(`/visitors/${id}/status`, {
        status: action.toLowerCase(),
        remarks,
      });
      setVisitors(prev => prev.map(v =>
        v._id === id ? { ...v, status: action, wardenRemarks: remarks } : v
      ));
      toast.success(`Visitor pass marked as ${action.replace("_", " ").toLowerCase()}!`);
      setSelected(null);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to update visitor status.`);
    }
  };

  const filterTabs = [
    { id: "",          label: `All (${visitors.length})` },
    { id: "Pending",   label: `Pending (${visitors.filter(v => v.status.toLowerCase() === "pending").length})` },
    { id: "Approved",  label: `Approved (${visitors.filter(v => v.status.toLowerCase() === "approved").length})` },
    { id: "Checked_in", label: `Checked In (${visitors.filter(v => v.status.toLowerCase() === "checked_in").length})` },
    { id: "Rejected",  label: `Rejected (${visitors.filter(v => v.status.toLowerCase() === "rejected").length})` },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 min-h-screen"
      style={{ background: "linear-gradient(145deg,#0f1320,#0d111c)", padding: "1.5rem", borderRadius: "1.25rem" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Visitor Gate Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Review, approve, and track student visitor gate entries and digital clearances</p>
        </div>
        <button
          onClick={fetchVisitors}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors self-start sm:self-auto"
        >
          Refresh Passes
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => { const Icon = s.icon; return (
          <motion.div key={s.label} whileHover={{ scale: 1.02 }} className="p-4 rounded-2xl border border-white/8" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}><Icon size={16} className="text-white" /></div>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </motion.div>
        ); })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search by student, visitor name, pass # or reg no..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white border border-white/10 outline-none focus:border-violet-500/60 transition-colors"
            style={{ background: "#0d111c" }} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filterTabs.map(t => (
            <button key={t.id || "All"} onClick={() => setFilter(t.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filter === t.id ? "text-white shadow-lg" : "text-slate-400 border border-white/10 hover:bg-white/5"}`}
              style={filter === t.id ? { background: "linear-gradient(135deg,#7c3aed,#6d28d9)" } : {}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visitor Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Clock size={32} className="animate-spin text-violet-500 mx-auto mb-2" />
          <p className="text-sm">Loading visitor gate passes...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
          <Users size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No visitor records match your filter</p>
          {filter && (
            <button
              onClick={() => setFilter("")}
              className="mt-3 text-xs text-violet-400 hover:underline font-semibold"
            >
              Show all passes ({visitors.length})
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v, i) => (
            <motion.div key={v._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="p-4 rounded-2xl border border-white/8 group cursor-pointer hover:border-white/15 transition-all"
              style={{ background: "rgba(255,255,255,0.04)" }}
              onClick={() => setSelected(v)}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {v.studentName?.charAt(0) || "S"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-violet-400">{v.visitorNumber}</span>
                        <span className="text-slate-600">•</span>
                        <span className="font-semibold text-white text-sm">{v.studentName}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{v.registerNo} • {v.department} • Room {v.room}</p>
                    </div>
                    <StatusBadge status={v.status} />
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <span className="flex items-center gap-1 font-semibold text-white">
                      <UserCircle size={13} className="text-cyan-400" />
                      {v.visitorName} ({v.relation})
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Phone size={12} />
                      {v.visitorPhone}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar size={12} />
                      {v.visitDate} ({v.visitTime})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                    <strong className="text-slate-300">Purpose:</strong> "{v.purpose}"
                  </p>
                </div>
                <div className="flex-shrink-0 self-center">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-all"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                    <Eye size={12} />Review
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {selected && <ReviewModal visitor={selected} onClose={() => setSelected(null)} onAction={handleAction} />}
      </AnimatePresence>
    </motion.div>
  );
};

export default VisitorManagementPage;
