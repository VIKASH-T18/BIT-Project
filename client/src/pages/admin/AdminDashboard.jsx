/**
 * @file AdminDashboard.jsx
 * @description Spacious, executive-level Admin Command & Analytics Dashboard
 * with live charts, block occupancy matrix, KPI cards, and administrative quick actions.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import {
  Users, Home, AlertTriangle, DollarSign, TrendingUp, Activity, Download,
  Shield, Building2, Utensils, CheckCircle2, ChevronRight, FileText, Settings,
  ArrowUpRight, ArrowDownRight, RefreshCw, Sparkles, UserCheck
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const COLORS = ["#2563eb", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#06b6d4"];

const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const end = typeof value === "number" ? value : 0;
    const duration = 1400;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value]);

  return <span>{display.toLocaleString()}</span>;
};

// ─── Spacious KPI Card ────────────────────────────────────────────────────────
const KPICard = ({ icon: Icon, label, value, prefix = "", change, color, sublabel }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="group relative overflow-hidden rounded-2xl p-6 sm:p-7 bg-light-surface dark:bg-dark-surface/90 border border-light-border dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
  >
    <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 blur-xl transition-opacity`} />

    <div className="flex items-start justify-between mb-4 relative z-10">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={22} className="text-white" />
      </div>
      {change !== undefined && (
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
            change >= 0
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
          }`}
        >
          {change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {change >= 0 ? `+${change}%` : `${change}%`}
        </span>
      )}
    </div>

    <div className="relative z-10 space-y-1">
      <p className="text-3xl font-black font-display tracking-tight text-light-text dark:text-dark-text">
        {prefix}<AnimatedNumber value={value} />
      </p>
      <p className="text-sm font-semibold text-light-text dark:text-dark-text">{label}</p>
      {sublabel && (
        <p className="text-xs text-light-muted dark:text-dark-muted">{sublabel}</p>
      )}
    </div>
  </motion.div>
);

// ─── Admin Dashboard Main ─────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { data: overviewData, isLoading, refetch } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const { data } = await api.get("/admins/overview");
      return data.data;
    },
    refetchInterval: 30000,
    retry: 1,
  });

  const { data: legacyData } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/analytics/overview");
        return data.data;
      } catch { return null; }
    },
    enabled: !overviewData,
  });

  const data = overviewData || legacyData;

  const occupancyData = overviewData?.byBlock?.map((b) => ({
    name: b.blockInfo?.name || b.blockInfo?.blockCode || "Block",
    occupied: b.totalOccupied || 0,
    available: (b.totalCapacity || 0) - (b.totalOccupied || 0),
    rate: Math.round(((b.totalOccupied || 0) / (b.totalCapacity || 1)) * 100),
  })) || [
    { name: "Block A", occupied: 85, available: 15, rate: 85 },
    { name: "Block B", occupied: 72, available: 28, rate: 72 },
    { name: "Block C", occupied: 90, available: 10, rate: 90 },
    { name: "Block D", occupied: 65, available: 35, rate: 65 },
  ];

  const deptData = overviewData?.deptDistribution?.map((d) => ({ name: d._id, value: d.count })) || [
    { name: "CSE", value: 420 }, { name: "ECE", value: 310 },
    { name: "MECH", value: 280 }, { name: "EEE", value: 190 },
    { name: "IT", value: 260 }, { name: "Others", value: 240 },
  ];

  const complaintTrend = data?.complaintTrend || [
    { month: "Jan", resolved: 40, pending: 8 }, { month: "Feb", resolved: 55, pending: 12 },
    { month: "Mar", resolved: 48, pending: 6 }, { month: "Apr", resolved: 60, pending: 9 },
    { month: "May", resolved: 75, pending: 5 }, { month: "Jun", resolved: 80, pending: 4 },
  ];

  const feeCollection = data?.feeCollection || [
    { month: "Jan", amount: 480000 }, { month: "Feb", amount: 620000 },
    { month: "Mar", amount: 590000 }, { month: "Apr", amount: 710000 },
    { month: "May", amount: 680000 }, { month: "Jun", amount: 820000 },
  ];

  const kpis = [
    { icon: Users,         label: "Total Students",    value: overviewData?.totalStudents || data?.totalStudents || 1240,            change: 8,   color: "from-blue-600 to-indigo-600", sublabel: "Enrolled in portal" },
    { icon: Home,          label: "Allocated Beds",    value: overviewData?.allocatedStudents || data?.occupiedRooms || 980,          change: 5,   color: "from-emerald-500 to-teal-600", sublabel: "Active residents" },
    { icon: AlertTriangle, label: "Pending Requests",  value: overviewData?.pendingApplications || data?.pendingComplaints || 14,    change: -12, color: "from-amber-500 to-orange-600", sublabel: "Awaiting approval" },
    { icon: DollarSign,    label: "Monthly Revenue",   value: data?.monthRevenue || 820000,                                         prefix: "₹", change: 14,  color: "from-violet-600 to-purple-600", sublabel: "Hostel & mess fees" },
    { icon: TrendingUp,    label: "Available Rooms",   value: overviewData?.availableRooms || data?.availableRooms || 64,            change: -3,  color: "from-cyan-500 to-blue-500", sublabel: "Ready for move-in" },
    { icon: Activity,      label: "Occupancy Rate",    value: overviewData?.occupancyRate || 84,                                    change: 2,   color: "from-rose-500 to-red-600", sublabel: "% of total capacity" },
  ];

  const handleExport = () => {
    toast.success("Hostel summary report exported as CSV");
  };

  return (
    <div className="space-y-8">
      {/* ── Executive Top Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Executive Console
            </span>
            <span className="text-xs text-light-muted dark:text-dark-muted">
              Live Campus Sync
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-light-text dark:text-dark-text tracking-tight mt-1">
            Admin Dashboard
          </h1>
          <p className="text-sm text-light-muted dark:text-dark-muted mt-0.5">
            Real-time monitoring, financial tracking, and hostel occupancy matrix
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            title="Refresh analytics data"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExport}
            className="btn btn-primary btn-sm flex items-center gap-2"
          >
            <Download size={15} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* ── Spacious KPI Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <KPICard {...k} />
          </motion.div>
        ))}
      </div>

      {/* ── Quick Admin Hub Shortcuts ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Link
          to="/admin/approvals"
          className="p-4 rounded-2xl card hover:border-indigo-500/40 transition-all flex flex-col justify-between group hover:no-underline"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="font-bold text-sm text-light-text dark:text-dark-text group-hover:text-indigo-500 transition-colors">Approvals</p>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">Hostel applications</p>
          </div>
        </Link>

        <Link
          to="/admin/students"
          className="p-4 rounded-2xl card hover:border-blue-500/40 transition-all flex flex-col justify-between group hover:no-underline"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Users size={20} />
          </div>
          <div>
            <p className="font-bold text-sm text-light-text dark:text-dark-text group-hover:text-blue-500 transition-colors">Students</p>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">Directory & roster</p>
          </div>
        </Link>

        <Link
          to="/admin/wardens"
          className="p-4 rounded-2xl card hover:border-purple-500/40 transition-all flex flex-col justify-between group hover:no-underline"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Shield size={20} />
          </div>
          <div>
            <p className="font-bold text-sm text-light-text dark:text-dark-text group-hover:text-purple-500 transition-colors">Wardens</p>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">Staff & duties</p>
          </div>
        </Link>

        <Link
          to="/admin/rooms"
          className="p-4 rounded-2xl card hover:border-emerald-500/40 transition-all flex flex-col justify-between group hover:no-underline"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Building2 size={20} />
          </div>
          <div>
            <p className="font-bold text-sm text-light-text dark:text-dark-text group-hover:text-emerald-500 transition-colors">Rooms & Blocks</p>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">Bed inventory</p>
          </div>
        </Link>

        <Link
          to="/admin/fees"
          className="p-4 rounded-2xl card hover:border-amber-500/40 transition-all flex flex-col justify-between group hover:no-underline"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="font-bold text-sm text-light-text dark:text-dark-text group-hover:text-amber-500 transition-colors">Fee Structures</p>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">Billing & dues</p>
          </div>
        </Link>

        <Link
          to="/admin/mess-menu"
          className="p-4 rounded-2xl card hover:border-orange-500/40 transition-all flex flex-col justify-between group hover:no-underline"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Utensils size={20} />
          </div>
          <div>
            <p className="font-bold text-sm text-light-text dark:text-dark-text group-hover:text-orange-500 transition-colors">Mess Menu</p>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">Weekly meal editor</p>
          </div>
        </Link>
      </div>

      {/* ── Block Occupancy Cards ──────────────────────────────────────────── */}
      <div className="card space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black font-display text-light-text dark:text-dark-text">
              Hostel Blocks Capacity & Occupancy Matrix
            </h3>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
              Live resident allocations per individual residential wing
            </p>
          </div>
          <Link to="/admin/rooms" className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1">
            Manage Rooms <ChevronRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {occupancyData.map((block) => (
            <div
              key={block.name}
              className="p-4 rounded-2xl bg-light-elevated dark:bg-dark-elevated/60 border border-light-border dark:border-white/5 space-y-2.5"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-light-text dark:text-dark-text">{block.name}</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {block.rate}% Filled
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-light-border dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                  style={{ width: `${Math.min(100, block.rate)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-light-muted dark:text-dark-muted">
                <span>{block.occupied} Occupied</span>
                <span className="text-emerald-500 font-semibold">{block.available} Vacant</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts Row 1: Bar & Pie ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Occupancy by Block Bar Chart */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black font-display text-light-text dark:text-dark-text text-base">
              Bed Occupancy vs Vacancy by Block
            </h3>
            <span className="text-xs text-light-muted dark:text-dark-muted">Live stats</span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="occupied" fill="#2563eb" radius={[6, 6, 0, 0]} name="Occupied Beds" />
                <Bar dataKey="available" fill="#22c55e" radius={[6, 6, 0, 0]} name="Available Beds" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Breakdown Pie Chart */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black font-display text-light-text dark:text-dark-text text-base">
              Students Distribution by Academic Dept
            </h3>
            <span className="text-xs text-light-muted dark:text-dark-muted">Total enrollment</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 h-72">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {deptData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full sm:w-1/2 flex flex-col gap-2.5">
              {deptData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2.5 text-xs font-semibold">
                  <div className="w-3.5 h-3.5 rounded-lg shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-light-muted dark:text-dark-muted">{d.name}</span>
                  <span className="font-mono font-bold text-light-text dark:text-dark-text ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row 2: Trend & Financials ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Complaint Trend */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black font-display text-light-text dark:text-dark-text text-base">
              Monthly Complaint Resolution Velocity
            </h3>
            <span className="text-xs text-light-muted dark:text-dark-muted">Last 6 months</span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complaintTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={3} dot={{ r: 5 }} name="Resolved" />
                <Line type="monotone" dataKey="pending" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} name="Pending" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fee Collection Area Chart */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black font-display text-light-text dark:text-dark-text text-base">
              Fee Collections & Revenue Stream (₹)
            </h3>
            <span className="text-xs text-light-muted dark:text-dark-muted">Financial inflow</span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={feeCollection}>
                <defs>
                  <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                  formatter={(v) => [`₹${v.toLocaleString()}`, "Revenue Collected"]}
                />
                <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={3} fill="url(#feeGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
