/**
 * @file RoomManagementPage.jsx
 * @description Admin room management with:
 *   - Real-time occupancy grid by block
 *   - Filter by status/type/AC
 *   - Manual allocation trigger
 *   - Bulk smart allocation button
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Filter, Search, Zap, Loader2, CheckCircle, Users,
  BarChart3, Building2, Wind, Wifi, AlertCircle, ChevronDown, X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// ─── Occupancy Bar ────────────────────────────────────────────────────────────
const OccupancyBar = ({ current, capacity }) => {
  const pct = capacity > 0 ? Math.round((current / capacity) * 100) : 0;
  const color = pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-light-border dark:bg-dark-border rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-light-muted dark:text-dark-muted w-10 text-right">{current}/{capacity}</span>
    </div>
  );
};

// ─── Room Card ────────────────────────────────────────────────────────────────
const RoomCard = ({ room }) => {
  const statusColors = {
    available:          "border-green-400/50 bg-green-500/5",
    partially_occupied: "border-yellow-400/50 bg-yellow-500/5",
    fully_occupied:     "border-red-400/50 bg-red-500/5",
    maintenance:        "border-gray-400/50 bg-gray-500/5",
    reserved:           "border-blue-400/50 bg-blue-500/5",
  };
  const statusLabel = {
    available:          { label: "Available",  cls: "text-green-600 dark:text-green-400" },
    partially_occupied: { label: "Partial",    cls: "text-yellow-600 dark:text-yellow-400" },
    fully_occupied:     { label: "Full",       cls: "text-red-600 dark:text-red-400" },
    maintenance:        { label: "Maint.",     cls: "text-gray-500" },
    reserved:           { label: "Reserved",   cls: "text-blue-600 dark:text-blue-400" },
  };

  const sc = statusLabel[room.status] || { label: room.status, cls: "text-light-muted" };

  return (
    <div className={`p-3 rounded-xl border-2 ${statusColors[room.status] || "border-light-border"} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm text-light-text dark:text-dark-text">{room.roomNumber}</span>
        <span className={`text-xs font-semibold ${sc.cls}`}>{sc.label}</span>
      </div>
      <p className="text-xs text-light-muted dark:text-dark-muted mb-1.5 capitalize">
        {room.roomType?.replace("_", " ")} {room.isAC ? "• AC" : ""}
      </p>
      <OccupancyBar current={room.currentOccupancy} capacity={room.capacity} />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const RoomManagementPage = () => {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status: "", roomType: "", isAC: "" });
  const [search, setSearch] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState("");

  // Occupancy overview
  const { data: occupancy, isLoading: occLoading } = useQuery({
    queryKey: ["room-occupancy"],
    queryFn: async () => {
      const { data } = await api.get("/rooms/occupancy");
      return data.data;
    },
    refetchInterval: 30000,
  });

  // Rooms list
  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ["rooms", filters, search],
    queryFn: async () => {
      const params = new URLSearchParams({ ...filters, search, limit: 100 });
      const { data } = await api.get(`/rooms?${params}`);
      return data.data;
    },
  });

  // Hostels
  const { data: hostels = [] } = useQuery({
    queryKey: ["hostels-list"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/hostels");
        return data.data || [];
      } catch { return []; }
    },
  });

  // Bulk allocation mutation
  const bulkMutation = useMutation({
    mutationFn: async (hostelId) => {
      const { data } = await api.post("/allocations/bulk-smart", { hostelId });
      return data;
    },
    onSuccess: (data) => {
      toast.success(`✅ ${data.data.allocated} students allocated, ${data.data.waitlisted} waitlisted!`);
      setShowBulkModal(false);
      qc.invalidateQueries({ queryKey: ["room-occupancy"] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Bulk allocation failed"),
  });

  const updateFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));
  const rooms = roomsData?.rooms || [];
  const summary = occupancy?.summary || {};

  // Group rooms by block name
  const roomsByBlock = rooms.reduce((acc, room) => {
    const block = room.block?.name || room.block?.blockCode || "Unknown";
    if (!acc[block]) acc[block] = [];
    acc[block].push(room);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-display text-light-text dark:text-dark-text">Room Management</h1>
          <p className="text-light-muted dark:text-dark-muted text-sm mt-0.5">Real-time occupancy tracking and allocation</p>
        </div>
        <button
          onClick={() => setShowBulkModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Zap size={16} /> Smart Bulk Allocate
        </button>
      </div>

      {/* ── Occupancy Overview ───────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Rooms",     value: summary.totalRooms || 0,     color: "from-blue-500 to-indigo-600",   icon: Home },
          { label: "Available",       value: summary.available || 0,      color: "from-green-500 to-emerald-600", icon: CheckCircle },
          { label: "Partially Full",  value: summary.partial || 0,        color: "from-yellow-500 to-orange-500", icon: Users },
          { label: "Fully Occupied",  value: summary.full || 0,           color: "from-red-500 to-rose-600",      icon: Building2 },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-black font-display text-light-text dark:text-dark-text">{card.value}</p>
              <p className="text-sm text-light-muted dark:text-dark-muted">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Occupancy rate bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-500" />
            <h3 className="font-bold text-light-text dark:text-dark-text">Overall Occupancy</h3>
          </div>
          <span className="font-black text-2xl text-blue-500">{summary.occupancyRate || 0}%</span>
        </div>
        <div className="h-3 bg-light-border dark:bg-dark-border rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${summary.occupancyRate || 0}%` }}
            transition={{ duration: 1.2 }}
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
          />
        </div>
        <div className="flex justify-between text-xs text-light-muted dark:text-dark-muted mt-1">
          <span>{summary.totalOccupied || 0} beds occupied</span>
          <span>{summary.totalCapacity || 0} total capacity</span>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────── */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
            <input
              type="text"
              placeholder="Search room number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bit-input pl-8"
            />
          </div>

          <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)} className="bit-input sm:w-40">
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="partially_occupied">Partial</option>
            <option value="fully_occupied">Full</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <select value={filters.roomType} onChange={(e) => updateFilter("roomType", e.target.value)} className="bit-input sm:w-36">
            <option value="">All Types</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="triple">Triple</option>
            <option value="four_sharing">Four Sharing</option>
          </select>

          <select value={filters.isAC} onChange={(e) => updateFilter("isAC", e.target.value)} className="bit-input sm:w-28">
            <option value="">AC/Non-AC</option>
            <option value="true">AC Only</option>
            <option value="false">Non-AC</option>
          </select>
        </div>
      </div>

      {/* ── Rooms Grid by Block ──────────────────────── */}
      {roomsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-light-elevated dark:bg-dark-elevated animate-pulse" />
          ))}
        </div>
      ) : (
        Object.entries(roomsByBlock).map(([blockName, blockRooms]) => (
          <div key={blockName} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold font-display text-light-text dark:text-dark-text flex items-center gap-2">
                <Building2 size={16} className="text-blue-500" /> {blockName}
              </h3>
              <span className="text-xs text-light-muted dark:text-dark-muted">
                {blockRooms.filter((r) => r.status === "available").length} available / {blockRooms.length} rooms
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {blockRooms.map((room) => (
                <RoomCard key={room._id} room={room} />
              ))}
            </div>
          </div>
        ))
      )}

      {!roomsLoading && rooms.length === 0 && (
        <div className="card text-center py-12">
          <Home size={32} className="text-light-border dark:text-dark-border mb-2 mx-auto" />
          <p className="text-light-muted dark:text-dark-muted">No rooms found matching current filters.</p>
        </div>
      )}

      {/* ── Bulk Allocation Modal ────────────────────── */}
      <AnimatePresence>
        {showBulkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowBulkModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="card w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Zap size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold font-display text-light-text dark:text-dark-text">Smart Bulk Allocation</h3>
                    <p className="text-xs text-light-muted dark:text-dark-muted">AI-powered priority-based assignment</p>
                  </div>
                </div>
                <button onClick={() => setShowBulkModal(false)} className="text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text">
                  <X size={20} />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 mb-4">
                <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">🤖 How it works:</p>
                <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-0.5">
                  <li>• Sorts all approved applications by priority score</li>
                  <li>• Final year, medical, disability students get top priority</li>
                  <li>• Matches compatible roommates using AI algorithm</li>
                  <li>• Sends email notification to each allocated student</li>
                </ul>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-light-text dark:text-dark-text mb-1.5">
                  Select Hostel *
                </label>
                <select
                  value={selectedHostel}
                  onChange={(e) => setSelectedHostel(e.target.value)}
                  className="bit-input"
                >
                  <option value="">Select hostel to allocate...</option>
                  {hostels.map((h) => (
                    <option key={h._id} value={h._id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!selectedHostel) { toast.error("Please select a hostel"); return; }
                    bulkMutation.mutate(selectedHostel);
                  }}
                  disabled={bulkMutation.isPending || !selectedHostel}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {bulkMutation.isPending ? (
                    <><Loader2 size={15} className="animate-spin" /> Allocating...</>
                  ) : (
                    <><Zap size={15} /> Run Allocation</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomManagementPage;
