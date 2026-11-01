/**
 * @file RoomAllocationPage.jsx
 * @description Warden room allocation management — live student allocation data
 * with search, filter by block/status, occupancy KPIs, and individual student detail modal.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Search, Users, Bed, Building2, CheckCircle,
  X, ChevronRight, AlertTriangle, Loader2, RefreshCw,
  UserX, Phone, Mail, GraduationCap, Calendar, Hash,
  Shield, MapPin, BedDouble,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const STATUS_CFG = {
  active:  { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400", label: "Active" },
  vacated: { bg: "bg-red-500/20",     text: "text-red-400",     border: "border-red-500/30",     dot: "bg-red-400",     label: "Vacated" },
  pending: { bg: "bg-amber-500/20",   text: "text-amber-400",   border: "border-amber-500/30",   dot: "bg-amber-400",   label: "Pending" },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

// ─── Student Detail Modal ────────────────────────────────────────────────────
const AllocationModal = ({ alloc, onClose, onVacate, isVacating }) => {
  const student = alloc.student || {};
  const user    = student.user || {};
  const room    = alloc.room   || {};
  const block   = alloc.block  || {};
  const hostel  = alloc.hostel || {};

  const initials = (user.name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
        className="w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(145deg,#1a1f2e,#141824)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-white">{user.name || "Student"}</h3>
              <p className="text-xs text-slate-400">{student.registerNumber || "—"} • {student.department || "—"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Allocation Details */}
          <div>
            <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Room Details</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Home,          l: "Room No",    v: room.roomNumber || "—" },
                { icon: BedDouble,     l: "Bed",        v: alloc.bedNumber || "—" },
                { icon: Building2,     l: "Block",      v: block.name || block.blockCode || "—" },
                { icon: MapPin,        l: "Hostel",     v: hostel.name || "—" },
                { icon: Hash,          l: "Room Type",  v: (room.roomType || "—").replace("_", " ") },
                { icon: Shield,        l: "Status",     v: STATUS_CFG[alloc.status]?.label || alloc.status || "—" },
              ].map(({ icon: Icon, l, v }) => (
                <div key={l} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={11} className="text-slate-500" />
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{l}</p>
                  </div>
                  <p className="text-sm text-white font-semibold capitalize">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Student Details */}
          <div>
            <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Student Info</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: GraduationCap, l: "Year",       v: student.year ? `Year ${student.year}` : "—" },
                { icon: GraduationCap, l: "Section",    v: student.section || "—" },
                { icon: Mail,          l: "Email",      v: user.email || "—" },
                { icon: Phone,         l: "Phone",      v: student.phone || user.phone || "—" },
                { icon: Calendar,      l: "Allocated",  v: fmtDate(alloc.allocationDate || alloc.createdAt) },
                { icon: Calendar,      l: "Check-in",   v: fmtDate(alloc.checkInDate) },
              ].map(({ icon: Icon, l, v }) => (
                <div key={l} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={11} className="text-slate-500" />
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{l}</p>
                  </div>
                  <p className="text-xs text-white font-medium truncate">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Year */}
          {alloc.academicYear && (
            <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: "rgba(109,40,217,0.1)", border: "1px solid rgba(109,40,217,0.2)" }}>
              <GraduationCap size={16} className="text-violet-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 font-semibold">Academic Year</p>
                <p className="text-sm text-white font-bold">{alloc.academicYear}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-slate-300 border border-white/10 hover:bg-white/5 transition-colors"
          >
            Close
          </button>
          {alloc.status === "active" && (
            <button
              onClick={() => {
                if (window.confirm(`Vacate room for ${user.name || "this student"}? This cannot be undone.`)) {
                  onVacate(alloc._id);
                }
              }}
              disabled={isVacating}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-all"
              style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}
            >
              {isVacating ? <Loader2 size={15} className="animate-spin" /> : <UserX size={15} />}
              {isVacating ? "Vacating..." : "Vacate Room"}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const RoomAllocationPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch]       = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selected, setSelected]   = useState(null);

  // ── Fetch all allocations ──────────────────────────────────────────────────
  const { data: raw = {}, isLoading, refetch } = useQuery({
    queryKey: ["warden-allocations", statusFilter],
    queryFn: async () => {
      const params = { limit: 200 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get("/allocations", { params });
      return data.data || {};
    },
    refetchInterval: 60000,
  });

  const allocations = raw.allocations || [];

  // ── Fetch dashboard stats ──────────────────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ["allocation-stats"],
    queryFn: async () => {
      const { data } = await api.get("/allocations/dashboard");
      return data.data;
    },
  });

  // ── Vacate mutation ────────────────────────────────────────────────────────
  const vacateMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/allocations/${id}/vacate`, { reason: "Vacated by warden" });
      return data;
    },
    onSuccess: () => {
      toast.success("Room vacated successfully.");
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["warden-allocations"] });
      queryClient.invalidateQueries({ queryKey: ["allocation-stats"] });
      queryClient.invalidateQueries({ queryKey: ["warden-dashboard"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to vacate room.");
    },
  });

  // ── Derive filter blocks from loaded allocations ───────────────────────────
  const blocks = [...new Set(
    allocations.map((a) => a.block?.name || a.block?.blockCode).filter(Boolean)
  )].sort();

  // ── Client-side search + block filter ─────────────────────────────────────
  const filtered = allocations.filter((a) => {
    const name    = a.student?.user?.name || "";
    const reg     = a.student?.registerNumber || "";
    const room    = a.room?.roomNumber || "";
    const dept    = a.student?.department || "";
    const blockName = a.block?.name || a.block?.blockCode || "";
    const matchSearch =
      !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      reg.toLowerCase().includes(search.toLowerCase()) ||
      room.toLowerCase().includes(search.toLowerCase()) ||
      dept.toLowerCase().includes(search.toLowerCase());
    const matchBlock = !blockFilter || blockName === blockFilter;
    return matchSearch && matchBlock;
  });

  // ── KPI cards ──────────────────────────────────────────────────────────────
  const kpis = [
    {
      label: "Total Allocated",
      value: stats?.totalStudentsAllocated ?? allocations.filter((a) => a.status === "active").length,
      color: "from-blue-500 to-indigo-600",
      icon: Users,
    },
    {
      label: "Available Beds",
      value: stats?.availableRooms ?? "—",
      color: "from-emerald-500 to-teal-600",
      icon: Bed,
    },
    {
      label: "Fully Occupied",
      value: stats?.fullyOccupied ?? "—",
      color: "from-red-500 to-rose-600",
      icon: AlertTriangle,
    },
    {
      label: "Occupancy Rate",
      value: stats?.occupancyRate ? `${stats.occupancyRate}%` : "—",
      color: "from-violet-500 to-purple-600",
      icon: Building2,
    },
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/25">
              Hostel Management
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">Student Allocations</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {filtered.length} {statusFilter || "total"} allocations • Click any row to view full student details
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-colors"
          title="Refresh data"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <motion.div
              key={k.label}
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-2xl border border-white/8"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center mb-3`}>
                <Icon size={16} className="text-white" />
              </div>
              <p className="text-2xl font-black text-white">{k.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{k.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by student name, register no, room, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white border border-white/10 outline-none focus:border-violet-500/60 transition-colors"
            style={{ background: "#0d111c" }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Block filter */}
          <select
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 border border-white/10 outline-none focus:border-violet-500/60"
            style={{ background: "#0d111c" }}
          >
            <option value="">All Blocks</option>
            {blocks.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>

          {/* Status filter */}
          {[
            { key: "active",  label: "Active" },
            { key: "vacated", label: "Vacated" },
            { key: "",        label: "All" },
          ].map(({ key, label }) => (
            <button
              key={key || "all"}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === key ? "text-white shadow-lg" : "text-slate-400 border border-white/10 hover:bg-white/5"
              }`}
              style={statusFilter === key ? { background: "linear-gradient(135deg,#7c3aed,#6d28d9)" } : {}}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Allocation Table / List */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-violet-500 mx-auto" />
          <p className="text-sm text-slate-400 font-semibold">Loading student allocations...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
          <Home size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No allocations found</p>
          <p className="text-xs text-slate-600 mt-1">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/8 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <div className="col-span-4">Student</div>
            <div className="col-span-2 hidden sm:block">Register No</div>
            <div className="col-span-2">Room</div>
            <div className="col-span-2 hidden md:block">Block / Bed</div>
            <div className="col-span-2 hidden sm:block">Status</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/5">
            {filtered.map((a, i) => {
              const name     = a.student?.user?.name || "Student";
              const reg      = a.student?.registerNumber || "—";
              const dept     = a.student?.department || "";
              const year     = a.student?.year ? `Yr ${a.student.year}` : "";
              const roomNo   = a.room?.roomNumber || "—";
              const blockName = a.block?.name || a.block?.blockCode || "—";
              const bed      = a.bedNumber || "—";
              const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

              return (
                <motion.div
                  key={a._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  onClick={() => setSelected(a)}
                  className="grid grid-cols-12 gap-2 px-4 py-3.5 cursor-pointer hover:bg-white/5 transition-colors group items-center"
                >
                  {/* Student */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
                        {name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {[dept, year].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                  </div>

                  {/* Reg No */}
                  <div className="col-span-2 hidden sm:block">
                    <p className="text-xs font-mono text-slate-300">{reg}</p>
                  </div>

                  {/* Room */}
                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20 text-xs font-bold">
                      <Home size={11} /> {roomNo}
                    </span>
                  </div>

                  {/* Block / Bed */}
                  <div className="col-span-2 hidden md:block">
                    <p className="text-xs text-slate-300 font-semibold">{blockName}</p>
                    <p className="text-[11px] text-slate-500">Bed {bed}</p>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 hidden sm:flex items-center justify-between">
                    <StatusBadge status={a.status} />
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-violet-400 transition-colors" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer count */}
          <div className="px-4 py-3 border-t border-white/8">
            <p className="text-xs text-slate-500">
              Showing <strong className="text-slate-300">{filtered.length}</strong> of <strong className="text-slate-300">{allocations.length}</strong> allocations
              {raw.pagination ? ` (Total in DB: ${raw.pagination.total})` : ""}
            </p>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <AllocationModal
            alloc={selected}
            onClose={() => setSelected(null)}
            onVacate={(id) => vacateMutation.mutate(id)}
            isVacating={vacateMutation.isPending}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RoomAllocationPage;
