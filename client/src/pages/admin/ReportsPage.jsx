/**
 * @file ReportsPage.jsx
 * @description Admin analytics & reports — system-wide KPIs, charts, and exportable summaries.
 */
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import {
  Users, Home, TrendingUp, AlertCircle, Download, Loader2,
  GraduationCap, DollarSign, CheckCircle,
} from "lucide-react";
import api from "../../services/api";

const COLORS = ["#2563eb", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

const formatINR = (n) => n >= 100000
  ? `₹${(n / 100000).toFixed(1)}L`
  : `₹${(n || 0).toLocaleString("en-IN")}`;

const ReportsPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports-summary"],
    queryFn:  async () => { const { data } = await api.get("/reports/summary"); return data.data; },
    retry: 1,
  });

  const kpis = data?.kpis || {};

  const kpiCards = [
    { label: "Total Students",      value: kpis.totalStudents,       icon: Users,       color: "from-blue-500 to-blue-600" },
    { label: "Allocated Students",  value: kpis.allocatedStudents,   icon: Home,        color: "from-green-500 to-emerald-600" },
    { label: "Occupancy Rate",      value: `${kpis.occupancyRate}%`, icon: TrendingUp,  color: "from-purple-500 to-purple-600" },
    { label: "Pending Applications",value: kpis.pendingApplications,icon: AlertCircle, color: "from-amber-500 to-orange-500" },
    { label: "Available Rooms",     value: kpis.availableRooms,      icon: CheckCircle, color: "from-teal-500 to-cyan-500" },
    { label: "Total Revenue",       value: formatINR(kpis.totalRevenue), icon: DollarSign, color: "from-rose-500 to-pink-600" },
  ];

  const deptData = (data?.charts?.deptBreakdown || []).map(d => ({
    dept: d._id || "Unknown",
    students: d.count,
  }));

  const genderData = (data?.charts?.genderBreakdown || []).map(d => ({
    name: (d._id || "unknown").charAt(0).toUpperCase() + (d._id || "unknown").slice(1),
    value: d.count,
  }));

  const statusData = (data?.charts?.statusBreakdown || []).map(d => ({
    name: (d._id || "unknown").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    value: d.count,
  }));

  const revenueData = (data?.charts?.monthlyRevenue || []).map(d => ({
    month: d._id,
    revenue: d.total,
  }));

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="animate-spin text-blue-500" size={36} />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black font-display text-light-text dark:text-dark-text">
            Analytics & Reports
          </h1>
          <p className="text-light-muted dark:text-dark-muted mt-1">
            System-wide statistics and exportable summaries
          </p>
        </div>
        <button className="btn btn-ghost flex items-center gap-2 text-sm">
          <Download size={16} /> Export PDF
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-xl font-black font-display text-light-text dark:text-dark-text">{value ?? "—"}</p>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Distribution */}
        <div className="card">
          <h3 className="font-bold text-light-text dark:text-dark-text mb-4">Students by Department</h3>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} margin={{ top: 4, right: 8, left: -16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="dept" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="students" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-light-muted dark:text-dark-muted text-sm">
              No data yet
            </div>
          )}
        </div>

        {/* Gender Distribution */}
        <div className="card">
          <h3 className="font-bold text-light-text dark:text-dark-text mb-4">Gender Distribution</h3>
          {genderData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={genderData} dataKey="value" cx="50%" cy="50%"
                    outerRadius={80} innerRadius={45} paddingAngle={3}>
                    {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-2 flex-shrink-0">
                {genderData.map((d, i) => (
                  <li key={d.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-light-text dark:text-dark-text">{d.name}</span>
                    <span className="ml-auto font-bold text-light-text dark:text-dark-text">{d.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-light-muted dark:text-dark-muted text-sm">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hostel Status Breakdown */}
        <div className="card">
          <h3 className="font-bold text-light-text dark:text-dark-text mb-4">Hostel Status Breakdown</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData} layout="vertical" margin={{ left: 20, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-light-muted dark:text-dark-muted text-sm">
              No data yet
            </div>
          )}
        </div>

        {/* Monthly Revenue */}
        <div className="card">
          <h3 className="font-bold text-light-text dark:text-dark-text mb-4">Monthly Revenue Trend</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+"K" : v}`} />
                <Tooltip formatter={v => formatINR(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#revenueGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-light-muted dark:text-dark-muted text-sm">
              No payment data yet
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ReportsPage;
