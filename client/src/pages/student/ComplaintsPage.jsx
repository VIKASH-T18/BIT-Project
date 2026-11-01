/**
 * @file ComplaintsPage.jsx
 * @description Comprehensive Student Maintenance & Complaint Management System
 * with ticket logging, live tracking, timeline history, and resolution feedback.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Plus, Search, Filter, CheckCircle2, Clock,
  Wrench, Wifi, Zap, Droplets, Bed, Sparkles, X, ChevronRight,
  Star, MessageSquare, ShieldAlert, Check
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const CATEGORY_MAP = {
  internet:    { label: "Wi-Fi & Internet", icon: Wifi, color: "from-blue-500 to-indigo-600" },
  electricity: { label: "Electricity",       icon: Zap, color: "from-amber-500 to-orange-500" },
  water:       { label: "Plumbing / Water",  icon: Droplets, color: "from-cyan-500 to-blue-500" },
  cleanliness: { label: "Cleanliness",       icon: Sparkles, color: "from-emerald-500 to-teal-500" },
  furniture:   { label: "Furniture & Bed",   icon: Bed, color: "from-purple-500 to-violet-600" },
  maintenance: { label: "General Repair",    icon: Wrench, color: "from-slate-500 to-gray-600" },
};

const ComplaintsPage = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New complaint form state
  const [formData, setFormData] = useState({
    type: "internet",
    priority: "medium",
    title: "",
    description: "",
    roomNumber: "A101",
  });

  // Query complaints from API
  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["my-complaints"],
    queryFn: async () => {
      const { data } = await api.get("/complaints/my");
      return data.data;
    },
  });

  // Submit Complaint Mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/complaints", payload);
      return data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Complaint registered successfully!");
      setIsModalOpen(false);
      setFormData({ type: "internet", priority: "medium", title: "", description: "", roomNumber: "A101" });
      queryClient.invalidateQueries({ queryKey: ["my-complaints"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to register complaint.");
    },
  });

  // Withdraw pending complaint mutation
  const withdrawMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/complaints/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success("Complaint withdrawn successfully.");
      queryClient.invalidateQueries({ queryKey: ["my-complaints"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to withdraw complaint.");
    },
  });

  // Rate Resolution Mutation
  const feedbackMutation = useMutation({
    mutationFn: async ({ id, rating }) => {
      const { data } = await api.patch(`/complaints/${id}/feedback`, { rating });
      return data;
    },
    onSuccess: () => {
      toast.success("Thank you for your feedback!");
      queryClient.invalidateQueries({ queryKey: ["my-complaints"] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error("Please fill in the title and description.");
      return;
    }
    createMutation.mutate(formData);
  };

  // Filtered list
  const filtered = complaints.filter((c) => {
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    const matchesSearch =
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.complaintNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === "pending").length;
  const inProgressCount = complaints.filter((c) => c.status === "in_progress" || c.status === "assigned").length;
  const resolvedCount = complaints.filter((c) => c.status === "resolved" || c.status === "closed").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25">
              Hostel Maintenance
            </span>
            <span className="text-xs text-light-muted dark:text-dark-muted font-medium">SLA: 24h Resolution</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-light-text dark:text-dark-text mt-1">
            Complaints & Repairs
          </h1>
          <p className="text-sm text-light-muted dark:text-dark-muted mt-0.5">
            Lodge maintenance tickets, track technician assignments, and rate resolutions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-lg shadow-rose-700/25 transition-all self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Lodge Complaint</span>
        </button>
      </div>

      {/* ── Quick KPI Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 space-y-1">
          <p className="text-xs text-light-muted dark:text-dark-muted font-semibold">Total Tickets</p>
          <p className="text-2xl font-black font-display text-light-text dark:text-dark-text">{totalCount}</p>
          <p className="text-[11px] text-light-muted dark:text-dark-muted">All-time logged</p>
        </div>
        <div className="card p-4 space-y-1 border-amber-500/20 bg-amber-500/5">
          <p className="text-xs text-amber-500 font-semibold">Pending Review</p>
          <p className="text-2xl font-black font-display text-amber-500">{pendingCount}</p>
          <p className="text-[11px] text-light-muted dark:text-dark-muted">Awaiting assignment</p>
        </div>
        <div className="card p-4 space-y-1 border-blue-500/20 bg-blue-500/5">
          <p className="text-xs text-blue-500 font-semibold">In Progress</p>
          <p className="text-2xl font-black font-display text-blue-500">{inProgressCount}</p>
          <p className="text-[11px] text-light-muted dark:text-dark-muted">Technician dispatched</p>
        </div>
        <div className="card p-4 space-y-1 border-emerald-500/20 bg-emerald-500/5">
          <p className="text-xs text-emerald-500 font-semibold">Resolved</p>
          <p className="text-2xl font-black font-display text-emerald-500">{resolvedCount}</p>
          <p className="text-[11px] text-light-muted dark:text-dark-muted">Completed & verified</p>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-light-elevated/80 dark:bg-dark-elevated/80 border border-light-border dark:border-dark-border/60 overflow-x-auto">
          {[
            { id: "all", label: "All Tickets" },
            { id: "pending", label: "Pending" },
            { id: "in_progress", label: "In Progress" },
            { id: "resolved", label: "Resolved" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === tab.id
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
          <input
            type="text"
            placeholder="Search by ticket or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>
      </div>

      {/* ── Complaints Grid / List ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-20 text-center text-light-muted dark:text-dark-muted">
          <Wrench size={32} className="animate-spin text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-semibold">Loading your maintenance records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-base font-bold text-light-text dark:text-dark-text">No matching complaints found</h3>
          <p className="text-xs text-light-muted dark:text-dark-muted max-w-sm mx-auto">
            Everything in your room seems to be in order! If you need assistance with electrical, plumbing, or internet, click "Lodge Complaint".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((ticket) => {
            const cat = CATEGORY_MAP[ticket.type] || CATEGORY_MAP.maintenance;
            const CatIcon = cat.icon;
            const isResolved = ticket.status === "resolved" || ticket.status === "closed";

            return (
              <motion.div
                key={ticket._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-5 space-y-4 hover:border-rose-500/30 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                        <CatIcon size={18} />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono font-bold text-rose-500 dark:text-rose-400">
                          {ticket.complaintNumber || "CMP-2026-TKT"}
                        </span>
                        <p className="text-xs font-semibold text-light-muted dark:text-dark-muted">
                          {cat.label} • {ticket.room?.roomNumber || "Room A101"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        ticket.priority === "urgent" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                        ticket.priority === "high" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                        "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}>
                        {ticket.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        isResolved ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" :
                        ticket.status === "in_progress" ? "bg-blue-500/15 text-blue-400 border border-blue-500/25" :
                        "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                      }`}>
                        {ticket.status?.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-light-text dark:text-dark-text leading-snug">
                    {ticket.title}
                  </h3>

                  <p className="text-xs text-light-muted dark:text-dark-muted line-clamp-2 leading-relaxed">
                    {ticket.description}
                  </p>

                  {ticket.resolutionNote && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 space-y-0.5">
                      <span className="font-bold block">Technician Resolution:</span>
                      <span>{ticket.resolutionNote}</span>
                    </div>
                  )}
                </div>

                {/* Footer with date, rating & withdraw */}
                <div className="pt-3 border-t border-light-border dark:border-dark-border/60 flex items-center justify-between text-xs text-light-muted dark:text-dark-muted">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <Clock size={12} className="text-violet-400" />
                    {new Date(ticket.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </span>

                  {isResolved && (
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-semibold text-light-text dark:text-dark-text mr-1">Feedback:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => feedbackMutation.mutate({ id: ticket._id, rating: star })}
                          className={`hover:scale-125 transition-transform ${
                            (ticket.studentRating || 0) >= star ? "text-amber-400 fill-amber-400" : "text-slate-600"
                          }`}
                        >
                          <Star size={13} fill={(ticket.studentRating || 0) >= star ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  )}

                  {ticket.status === "pending" && (
                    <button
                      onClick={() => {
                        if (window.confirm("Withdraw this complaint?")) withdrawMutation.mutate(ticket._id);
                      }}
                      disabled={withdrawMutation.isPending}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25 hover:bg-rose-500/25 transition-colors"
                    >
                      <X size={11} /> Withdraw
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Lodge Complaint ────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg rounded-3xl card p-6 bg-light-card dark:bg-slate-900 border border-light-border dark:border-slate-800 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-light-border dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center">
                    <Wrench size={18} />
                  </div>
                  <h2 className="text-base font-bold text-light-text dark:text-dark-text font-display">
                    Lodge Maintenance Ticket
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-light-text dark:text-dark-text block mb-1.5">
                    Category of Issue
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text focus:outline-none focus:border-rose-500"
                  >
                    <option value="internet">Wi-Fi & Internet</option>
                    <option value="electricity">Electrical & Lights</option>
                    <option value="water">Plumbing & Water Supply</option>
                    <option value="cleanliness">Room & Floor Cleanliness</option>
                    <option value="furniture">Furniture, Mattress & Bed</option>
                    <option value="maintenance">General Infrastructure</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-light-text dark:text-dark-text block mb-1.5">
                      Priority Level
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text focus:outline-none focus:border-rose-500"
                    >
                      <option value="low">Low (Next 48h)</option>
                      <option value="medium">Medium (Within 24h)</option>
                      <option value="high">High (Same day)</option>
                      <option value="urgent">Urgent (Immediate)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-light-text dark:text-dark-text block mb-1.5">
                      Room Location
                    </label>
                    <input
                      type="text"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      placeholder="e.g. A101"
                      className="w-full px-3 py-2 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-light-text dark:text-dark-text block mb-1.5">
                    Brief Summary / Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wi-Fi router keeps dropping in evening"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-light-text dark:text-dark-text block mb-1.5">
                    Detailed Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Explain the specific issue and times it occurs..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-md shadow-rose-600/30 transition-all"
                  >
                    {createMutation.isPending ? "Submitting..." : "Submit Ticket"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComplaintsPage;
