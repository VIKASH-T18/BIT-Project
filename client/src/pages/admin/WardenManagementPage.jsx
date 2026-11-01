/**
 * @file WardenManagementPage.jsx
 * @description Admin warden management — list, search, view, and update warden assignments.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Shield, Building2, Phone, Mail, Edit3,
  CheckCircle, XCircle, ChevronRight, Loader2, X, Save,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const WardenCard = ({ warden, onEdit }) => {
  const user = warden.user || {};
  const initials = user.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "W";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card hover:shadow-lg transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          {user.profileUrl || user.avatar ? (
            <img src={user.profileUrl || user.avatar} alt={user.name}
              className="w-14 h-14 rounded-2xl object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">{initials}</span>
            </div>
          )}
          <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white
            ${user.isActive ? "bg-green-500" : "bg-gray-400"}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-light-text dark:text-dark-text truncate">{user.name || "Unknown"}</h3>
            <button onClick={() => onEdit(warden)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-light-elevated dark:hover:bg-dark-elevated transition-all">
              <Edit3 size={14} className="text-light-muted dark:text-dark-muted" />
            </button>
          </div>

          <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">{user.email}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="badge badge-info text-xs">{warden.employeeId}</span>
            {warden.designation && (
              <span className="badge badge-gray text-xs">{warden.designation}</span>
            )}
            {warden.assignedHostel && (
              <span className="badge badge-success text-xs flex items-center gap-1">
                <Building2 size={10} /> {warden.assignedHostel.name}
              </span>
            )}
          </div>

          {warden.phone && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-light-muted dark:text-dark-muted">
              <Phone size={11} /> {warden.phone}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const EditModal = ({ warden, hostels, onClose, onSave }) => {
  const [form, setForm] = useState({
    designation:    warden.designation || "",
    phone:          warden.phone || "",
    officeLocation: warden.officeLocation || "",
    assignedHostel: warden.assignedHostel?._id || "",
    isActive:       warden.user?.isActive ?? true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="card w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-display text-light-text dark:text-dark-text">
            Edit Warden
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-light-elevated dark:hover:bg-dark-elevated">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted mb-1.5 uppercase tracking-wide">
              Designation
            </label>
            <input className="input w-full" value={form.designation}
              onChange={e => setForm(p => ({ ...p, designation: e.target.value }))}
              placeholder="e.g. Chief Warden" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted mb-1.5 uppercase tracking-wide">
              Phone
            </label>
            <input className="input w-full" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted mb-1.5 uppercase tracking-wide">
              Assigned Hostel
            </label>
            <select className="input w-full" value={form.assignedHostel}
              onChange={e => setForm(p => ({ ...p, assignedHostel: e.target.value }))}>
              <option value="">-- Unassigned --</option>
              {(hostels || []).map(h => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted mb-1.5 uppercase tracking-wide">
              Office Location
            </label>
            <input className="input w-full" value={form.officeLocation}
              onChange={e => setForm(p => ({ ...p, officeLocation: e.target.value }))}
              placeholder="Admin Block, Room 101" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="warden-active" checked={form.isActive}
              onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
              className="w-4 h-4 rounded" />
            <label htmlFor="warden-active" className="text-sm text-light-text dark:text-dark-text">
              Account Active
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
          <button onClick={() => onSave(warden._id, form)} className="btn btn-primary flex-1 flex items-center justify-center gap-2">
            <Save size={14} /> Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const WardenManagementPage = () => {
  const [search, setSearch]     = useState("");
  const [editingWarden, setEditingWarden] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["wardens"],
    queryFn: async () => {
      const { data } = await api.get("/wardens");
      return data.data;
    },
    retry: 1,
  });

  const { data: hostelData } = useQuery({
    queryKey: ["hostels"],
    queryFn: async () => {
      const { data } = await api.get("/hostels");
      return data.data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/wardens/${id}`, payload),
    onSuccess: () => {
      toast.success("Warden updated successfully!");
      queryClient.invalidateQueries(["wardens"]);
      setEditingWarden(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Update failed"),
  });

  const wardens = (data?.wardens || []).filter(w =>
    !search || w.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    w.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display text-light-text dark:text-dark-text">
            Warden Management
          </h1>
          <p className="text-light-muted dark:text-dark-muted mt-1">
            {data?.total ?? 0} wardens registered in the system
          </p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search wardens…"
            className="input pl-9 w-64" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Wardens", value: data?.total ?? 0, color: "from-blue-500 to-blue-600", icon: Users },
          { label: "Active",        value: (data?.wardens || []).filter(w => w.user?.isActive).length, color: "from-green-500 to-green-600", icon: CheckCircle },
          { label: "Unassigned",    value: (data?.wardens || []).filter(w => !w.assignedHostel).length, color: "from-amber-500 to-amber-600", icon: Shield },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-black font-display text-light-text dark:text-dark-text">{value}</p>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Warden Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : wardens.length === 0 ? (
        <div className="card">
          <div className="empty-state py-16">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield size={28} className="text-white" />
            </div>
            <h3 className="text-lg font-bold font-display text-light-text dark:text-dark-text mb-2">
              No wardens found
            </h3>
            <p className="text-light-muted dark:text-dark-muted text-sm max-w-sm text-center">
              {search ? "No wardens match your search." : "Wardens will appear here once registered."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {wardens.map(w => (
            <WardenCard key={w._id} warden={w} onEdit={setEditingWarden} />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingWarden && (
          <EditModal
            warden={editingWarden}
            hostels={hostelData}
            onClose={() => setEditingWarden(null)}
            onSave={(id, payload) => updateMutation.mutate({ id, payload })}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WardenManagementPage;
