/**
 * @file AnalyticsPage.jsx
 * @description Admin Live Operations & Real-time Analytics Dashboard.
 */
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity, Users, Home, AlertTriangle, ShieldCheck, UserCheck,
  RefreshCw, TrendingUp, CheckCircle2, Clock, ArrowUpRight, Zap
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import api from "../../services/api";

const AnalyticsPage = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data, isLoading, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["admin-live-analytics"],
    queryFn: async () => {
      const res = await api.get("/analytics/live");
      return res.data?.data;
    },
    refetchInterval: autoRefresh ? 15000 : false, // Auto refresh every 15s
  });

  const metrics = data?.metrics || {};
  const roomBreakdown = data?.roomBreakdown || [];
  const complaintsBreakdown = data?.complaintsBreakdown || [];
  const activityStream = data?.activityStream || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-12"
    >
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
              Live Real-Time Telemetry
            </span>
          </div>
          <h1 className="text-3xl font-black font-display text-light-text dark:text-dark-text mt-1">
            Hostel Operations Center
          </h1>
          <p className="text-light-muted dark:text-dark-muted text-sm mt-0.5">
            Instant operational metrics, live room occupancy, grievance triage, and student activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              autoRefresh
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : "bg-light-card dark:bg-dark-card text-light-muted border-light-border dark:border-dark-border"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {autoRefresh ? "Auto-refresh: 15s" : "Auto-refresh: Paused"}
          </button>
          <button
            onClick={() => refetch()}
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card p-4">
          <p className="text-xs text-light-muted dark:text-dark-muted font-medium">Occupancy Rate</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-black text-light-text dark:text-dark-text">
              {metrics.occupancyRate ?? 0}%
            </h3>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> Live
            </span>
          </div>
          <div className="w-full bg-light-surface dark:bg-dark-surface rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-primary-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.occupancyRate || 0)}%` }}
            />
          </div>
        </div>

        <div className="card p-4">
          <p className="text-xs text-light-muted dark:text-dark-muted font-medium">Total Students</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-black text-light-text dark:text-dark-text">
              {metrics.totalStudents ?? 0}
            </h3>
            <Users className="w-4 h-4 text-primary-500" />
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-3">Enrolled in system</p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-light-muted dark:text-dark-muted font-medium">Available Rooms</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-black text-emerald-500">
              {metrics.availableRooms ?? 0}
            </h3>
            <Home className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-3">Ready for allocation</p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-light-muted dark:text-dark-muted font-medium">Occupied Rooms</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-black text-blue-500">
              {metrics.occupiedRooms ?? 0}
            </h3>
            <Home className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-3">Currently filled</p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-light-muted dark:text-dark-muted font-medium">Today's Visitors</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-black text-purple-500">
              {metrics.todayVisitors ?? 0}
            </h3>
            <UserCheck className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-3">Logged gate passes</p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-light-muted dark:text-dark-muted font-medium">Open Complaints</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-black text-amber-500">
              {metrics.pendingComplaints ?? 0}
            </h3>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-3">Needs warden triage</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Status Donut */}
        <div className="card p-6">
          <h3 className="text-base font-bold text-light-text dark:text-dark-text mb-1">
            Real-Time Room Inventory
          </h3>
          <p className="text-xs text-light-muted dark:text-dark-muted mb-4">
            Current occupancy status across all campus hostel blocks
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roomBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roomBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaints Health Breakdown */}
        <div className="card p-6">
          <h3 className="text-base font-bold text-light-text dark:text-dark-text mb-1">
            Maintenance & Complaints Resolution
          </h3>
          <p className="text-xs text-light-muted dark:text-dark-muted mb-4">
            Triage breakdown by resolution phase
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complaintsBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {complaintsBreakdown.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Activity Feed Stream */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-light-text dark:text-dark-text">
              Live Campus Activity Stream
            </h3>
            <p className="text-xs text-light-muted dark:text-dark-muted">
              Recent applications, fee payments, and operations logged across the portal
            </p>
          </div>
          <span className="text-xs text-light-muted dark:text-dark-muted flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Updated {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "just now"}
          </span>
        </div>

        {activityStream.length === 0 ? (
          <div className="py-12 text-center text-light-muted dark:text-dark-muted text-sm">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No new activity logged in this period.
          </div>
        ) : (
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {activityStream.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.type === "payment"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-primary-500/10 text-primary-500"
                    }`}
                  >
                    {item.type === "payment" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Activity className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-light-text dark:text-dark-text">
                      {item.title}
                    </h4>
                    <p className="text-xs text-light-muted dark:text-dark-muted">
                      {item.description}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-light-muted dark:text-dark-muted whitespace-nowrap">
                  {new Date(item.time).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AnalyticsPage;
