/**
 * @file BroadcastNoticePage.jsx
 * @description Warden broadcast notice management — compose and send
 * notices to all hostel students or specific groups.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Plus, X, Bell, Calendar, Users, CheckCircle,
  Eye, Trash2, Clock, AlertTriangle, Loader2, Send,
  Pin, Info, Zap,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CATEGORIES = ["Maintenance", "Mess", "Inspection", "Event", "Emergency", "General"];
const TARGET_GROUPS = ["All Students", "Block A", "Block B", "Block C", "Year 1", "Year 2", "Year 3", "Year 4"];

const PRIORITY_CFG = {
  High:   { bg: "bg-red-500/20",    text: "text-red-400",    border: "border-red-500/30"    },
  Medium: { bg: "bg-amber-500/20",  text: "text-amber-400",  border: "border-amber-500/30"  },
  Low:    { bg: "bg-blue-500/20",   text: "text-blue-400",   border: "border-blue-500/30"   },
};

const CATEGORY_COLORS = {
  Maintenance: "from-orange-500 to-amber-500",
  Mess:        "from-green-500 to-emerald-600",
  Inspection:  "from-blue-500 to-indigo-600",
  Event:       "from-purple-500 to-violet-600",
  Emergency:   "from-red-500 to-rose-600",
  General:     "from-slate-500 to-gray-600",
};

const CATEGORY_ICONS = {
  Maintenance: Zap,
  Mess:        Users,
  Inspection:  Eye,
  Event:       Bell,
  Emergency:   AlertTriangle,
  General:     Info,
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

// ─── Compose Modal ────────────────────────────────────────────────────────────
const ComposeModal = ({ onClose, onSend }) => {
  const [form, setForm] = useState({
    title: "", content: "", category: "General", targetGroup: "All Students", priority: "Medium", isPinned: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    onSend(form);
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Megaphone size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Compose Notice</h3>
              <p className="text-xs text-slate-400">Broadcast to hostel students</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Notice Title *</label>
            <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Water supply interruption on Monday"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 outline-none focus:border-violet-500/60 transition-colors"
              style={{ background: "#0d111c" }} />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 outline-none focus:border-violet-500/60 transition-colors"
                style={{ background: "#0d111c" }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 outline-none focus:border-violet-500/60 transition-colors"
                style={{ background: "#0d111c" }}>
                {["High", "Medium", "Low"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Target Group */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Send To</label>
            <select value={form.targetGroup} onChange={e => setForm(p => ({ ...p, targetGroup: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 outline-none focus:border-violet-500/60 transition-colors"
              style={{ background: "#0d111c" }}>
              {TARGET_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Notice Content *</label>
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={5}
              placeholder="Write the full notice content here..."
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 outline-none focus:border-violet-500/60 transition-colors resize-none"
              style={{ background: "#0d111c" }} />
          </div>

          {/* Pin option */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.isPinned ? "bg-violet-500 border-violet-500" : "border-white/20"}`}
              onClick={() => setForm(p => ({ ...p, isPinned: !p.isPinned }))}>
              {form.isPinned && <CheckCircle size={12} className="text-white" />}
            </div>
            <span className="text-sm text-slate-300">Pin this notice to top</span>
          </label>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-slate-300 border border-white/10 hover:bg-white/5 transition-colors">
            Discard
          </button>
          <button onClick={handleSend} disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            {loading ? <><Loader2 size={15} className="animate-spin" />Sending...</> : <><Send size={15} />Broadcast</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const BroadcastNoticePage = () => {
  const [notices, setNotices] = useState([]);
  const [showCompose, setShowCompose] = useState(false);
  const [filter, setFilter] = useState("");

  const filtered = !filter ? notices : notices.filter(n => n.category === filter);
  const pinnedNotices = filtered.filter(n => n.isPinned);
  const regularNotices = filtered.filter(n => !n.isPinned);

  const stats = [
    { label: "Total Notices", value: notices.length,                              color: "from-blue-500 to-indigo-600",   icon: Megaphone },
    { label: "Pinned",        value: notices.filter(n => n.isPinned).length,      color: "from-violet-500 to-purple-600", icon: Pin       },
    { label: "This Week",     value: 4,                                            color: "from-emerald-500 to-green-600", icon: Calendar  },
    { label: "Avg. Read Rate",value: `${Math.round(notices.reduce((s, n) => s + (n.readCount / n.totalStudents * 100), 0) / notices.length)}%`, color: "from-amber-500 to-orange-500", icon: Eye },
  ];

  const handleSend = (form) => {
    const newNotice = {
      _id: `n${Date.now()}`,
      ...form,
      sentAt: new Date().toISOString(),
      readCount: 0,
      totalStudents: 248,
    };
    setNotices(prev => [newNotice, ...prev]);
    toast.success("Notice broadcasted successfully!");
    setShowCompose(false);
  };

  const handleDelete = (id) => {
    setNotices(prev => prev.filter(n => n._id !== id));
    toast.success("Notice deleted.");
  };

  const handleTogglePin = (id) => {
    setNotices(prev => prev.map(n => n._id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  const NoticeCard = ({ notice }) => {
    const CatIcon = CATEGORY_ICONS[notice.category] || Info;
    const catColor = CATEGORY_COLORS[notice.category] || "from-slate-500 to-gray-600";
    const pc = PRIORITY_CFG[notice.priority] || PRIORITY_CFG.Medium;
    const readPct = Math.round((notice.readCount / notice.totalStudents) * 100);

    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl border border-white/8 hover:border-white/15 transition-all"
        style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${catColor} flex items-center justify-center flex-shrink-0`}>
            <CatIcon size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-white text-sm">{notice.title}</p>
                {notice.isPinned && <Pin size={12} className="text-violet-400" />}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-md border font-semibold ${pc.bg} ${pc.text} ${pc.border}`}>{notice.priority}</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-slate-400">{notice.category}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{notice.content}</p>

            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1"><Users size={10} />{notice.targetGroup}</span>
                <span>{notice.readCount}/{notice.totalStudents} read ({readPct}%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all"
                  style={{ width: `${readPct}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={10} />{fmtDate(notice.sentAt)}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => handleTogglePin(notice._id)}
                  className={`p-1.5 rounded-lg transition-colors ${notice.isPinned ? "text-violet-400 bg-violet-500/20" : "text-slate-500 hover:text-violet-400 hover:bg-violet-500/10"}`}>
                  <Pin size={13} />
                </button>
                <button onClick={() => handleDelete(notice._id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 min-h-screen"
      style={{ background: "linear-gradient(145deg,#0f1320,#0d111c)", padding: "1.5rem", borderRadius: "1.25rem" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Broadcast Notices</h1>
          <p className="text-slate-400 text-sm mt-0.5">Compose and send notices to hostel students</p>
        </div>
        <button onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-all"
          style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
          <Plus size={16} />New Notice
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

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {["", ...CATEGORIES].map(c => (
          <button key={c || "All"} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === c ? "text-white shadow-lg" : "text-slate-400 border border-white/10 hover:bg-white/5"}`}
            style={filter === c ? { background: "linear-gradient(135deg,#7c3aed,#6d28d9)" } : {}}>
            {c || "All"}
          </button>
        ))}
      </div>

      {/* Pinned Notices */}
      {pinnedNotices.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Pin size={14} className="text-violet-400" />
            <h2 className="text-sm font-bold text-white">Pinned Notices</h2>
          </div>
          <div className="space-y-3">
            {pinnedNotices.map(n => <NoticeCard key={n._id} notice={n} />)}
          </div>
        </div>
      )}

      {/* Regular Notices */}
      <div>
        {pinnedNotices.length > 0 && <h2 className="text-sm font-bold text-white mb-3">Recent Notices</h2>}
        {regularNotices.length === 0 && pinnedNotices.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
            <Megaphone size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No notices yet</p>
            <button onClick={() => setShowCompose(true)}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
              Create First Notice
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {regularNotices.map(n => <NoticeCard key={n._id} notice={n} />)}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onSend={handleSend} />}
      </AnimatePresence>
    </motion.div>
  );
};

export default BroadcastNoticePage;
