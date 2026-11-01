/**
 * @file FeeManagementPage.jsx
 * @description Admin fee management — collection stats, payment records, and fee overview.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, Clock, CheckCircle, Filter,
  Search, Loader2, AlertCircle, Download,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import api from "../../services/api";

const COLORS = ["#2563eb", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#06b6d4"];

const STATUS_STYLES = {
  paid:       "badge-success",
  pending:    "badge-warning",
  failed:     "badge-error",
  processing: "badge-info",
  refunded:   "badge-gray",
  cancelled:  "badge-gray",
};

const FeeManagementPage = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter]     = useState("");
  const [page, setPage]                 = useState(1);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["fee-stats"],
    queryFn:  async () => { const { data } = await api.get("/payments/stats"); return data.data; },
    retry: 1,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["payments-list", statusFilter, typeFilter, page],
    queryFn:  async () => {
      const params = new URLSearchParams({ page, limit: 15 });
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter)   params.set("paymentType", typeFilter);
      const { data } = await api.get(`/payments/list?${params}`);
      return data.data;
    },
    retry: 1,
    keepPreviousData: true,
  });

  const formatINR = (n) => `₹${(n || 0).toLocaleString("en-IN")}`;

  const kpiCards = [
    {
      label: "Total Collected",
      value: formatINR(stats?.totalCollected),
      icon: CheckCircle,
      color: "from-green-500 to-emerald-600",
      sub: "all time",
    },
    {
      label: "This Month",
      value: formatINR(stats?.monthCollected),
      icon: TrendingUp,
      color: "from-blue-500 to-blue-600",
      sub: "collected",
    },
    {
      label: "Pending Dues",
      value: formatINR(stats?.totalPending),
      icon: Clock,
      color: "from-amber-500 to-orange-500",
      sub: "outstanding",
    },
  ];

  const pieData = (stats?.byType || []).map(t => ({
    name: t._id?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    value: t.total,
    count: t.count,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black font-display text-light-text dark:text-dark-text">
            Fee Management
          </h1>
          <p className="text-light-muted dark:text-dark-muted mt-1">
            Hostel fee collection and payment records
          </p>
        </div>
        <button className="btn btn-ghost flex items-center gap-2 text-sm">
          <Download size={16} /> Export
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="card">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
              <Icon size={22} className="text-white" />
            </div>
            {statsLoading ? (
              <div className="h-7 w-28 bg-light-border dark:bg-dark-border animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-black font-display text-light-text dark:text-dark-text">{value}</p>
            )}
            <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
              {label} <span className="opacity-60">— {sub}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      {!statsLoading && pieData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* By Type Pie */}
          <div className="card">
            <h3 className="font-bold text-light-text dark:text-dark-text mb-4">Revenue by Type</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatINR(v)} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-2 flex-shrink-0">
                {pieData.slice(0, 5).map((d, i) => (
                  <li key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-light-text dark:text-dark-text font-medium truncate max-w-[100px]">{d.name}</span>
                    <span className="text-light-muted dark:text-dark-muted ml-auto">{d.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recent Payments Mini List */}
          <div className="card">
            <h3 className="font-bold text-light-text dark:text-dark-text mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {(stats?.recentPayments || []).slice(0, 5).map(p => (
                <div key={p._id} className="flex items-center gap-3">
                  <img
                    src={p.student?.user?.profileUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.student?.user?.name || "S")}&background=2563eb&color=fff&size=32`}
                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-light-text dark:text-dark-text truncate">
                      {p.student?.user?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-light-muted dark:text-dark-muted capitalize">
                      {p.paymentType?.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-light-text dark:text-dark-text">{formatINR(p.amount)}</p>
                    <span className={`badge text-xs ${STATUS_STYLES[p.status] || "badge-gray"}`}>{p.status}</span>
                  </div>
                </div>
              ))}
              {!stats?.recentPayments?.length && (
                <p className="text-center text-sm text-light-muted dark:text-dark-muted py-6">No payment records yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="card">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <h3 className="font-bold text-light-text dark:text-dark-text flex-1">All Payments</h3>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input text-sm w-40">
            <option value="">All Status</option>
            {["paid", "pending", "failed", "processing", "refunded"].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="input text-sm w-44">
            <option value="">All Types</option>
            {["hostel_fee", "security_deposit", "mess_fee", "laundry", "fine", "other"].map(t => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        {paymentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-500" size={28} />
          </div>
        ) : (payments?.payments || []).length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle size={36} className="text-light-muted dark:text-dark-muted mx-auto mb-3" />
            <p className="text-light-muted dark:text-dark-muted text-sm">No payment records found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-light-border dark:border-dark-border">
                    {["Student", "Type", "Amount", "Status", "Due Date", "Paid"].map(h => (
                      <th key={h} className="text-left py-3 px-2 text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(payments?.payments || []).map(p => (
                    <tr key={p._id} className="border-b border-light-border/50 dark:border-dark-border/50 hover:bg-light-elevated dark:hover:bg-dark-elevated transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <img src={p.student?.user?.profileUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.student?.user?.name || "S")}&background=2563eb&color=fff&size=28`}
                            className="w-7 h-7 rounded-lg object-cover" alt="" />
                          <span className="font-medium text-light-text dark:text-dark-text">
                            {p.student?.user?.name || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-light-muted dark:text-dark-muted capitalize">
                        {p.paymentType?.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 px-2 font-semibold text-light-text dark:text-dark-text">
                        {formatINR(p.amount)}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`badge text-xs ${STATUS_STYLES[p.status] || "badge-gray"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-light-muted dark:text-dark-muted text-xs">
                        {p.dueDate ? new Date(p.dueDate).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="py-3 px-2 text-light-muted dark:text-dark-muted text-xs">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {payments?.pagination?.pages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-light-border dark:border-dark-border">
                <p className="text-xs text-light-muted dark:text-dark-muted">
                  Page {page} of {payments.pagination.pages} — {payments.pagination.total} records
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="btn btn-ghost text-xs py-1.5 px-3 disabled:opacity-40">← Prev</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= payments.pagination.pages}
                    className="btn btn-ghost text-xs py-1.5 px-3 disabled:opacity-40">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default FeeManagementPage;
