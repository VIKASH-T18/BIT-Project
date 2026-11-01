/**
 * @file VisitorPage.jsx
 * @description Student Visitor Pass Management with digital gate pass generation,
 * QR security clearance, and guest check-in tracking.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, QrCode, CheckCircle2, Clock, Calendar,
  ShieldCheck, X, Phone, UserCheck, ArrowRight, Download,
  Sparkles, AlertCircle, Trash2, IdCard, Check, Printer
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const VisitorPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    relationship: "Parent",
    phone: "",
    idProofType: "Aadhaar",
    idProofNumber: "",
    visitDate: new Date().toISOString().split("T")[0],
    expectedTimeIn: "10:00 AM",
    expectedTimeOut: "04:00 PM",
    numberOfVisitors: 1,
    purpose: "",
  });

  // Query visitors
  const { data: visitors = [], isLoading } = useQuery({
    queryKey: ["my-visitors"],
    queryFn: async () => {
      const { data } = await api.get("/visitors/my");
      return data.data;
    },
  });

  // Mutation to request pass
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/visitors", payload);
      return data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Visitor pass issued successfully!");
      setIsModalOpen(false);
      setFormData({
        name: "",
        relationship: "Parent",
        phone: "",
        idProofType: "Aadhaar",
        idProofNumber: "",
        visitDate: new Date().toISOString().split("T")[0],
        expectedTimeIn: "10:00 AM",
        expectedTimeOut: "04:00 PM",
        numberOfVisitors: 1,
        purpose: "",
      });
      queryClient.invalidateQueries(["my-visitors"]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to generate pass.");
    },
  });

  // Mutation to cancel pass
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/visitors/${id}`);
      return data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Visitor pass cancelled.");
      queryClient.invalidateQueries(["my-visitors"]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to cancel pass.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.purpose.trim()) {
      toast.error("Please fill in visitor name, contact phone, and purpose.");
      return;
    }
    createMutation.mutate(formData);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25";
      case "checked_in":
        return "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25";
      case "checked_out":
      case "completed":
        return "bg-blue-500/15 text-blue-400 border border-blue-500/25";
      case "rejected":
        return "bg-red-500/15 text-red-400 border border-red-500/25";
      default:
        return "bg-amber-500/15 text-amber-400 border border-amber-500/25";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
              Campus Gate Security
            </span>
            <span className="text-xs text-light-muted dark:text-dark-muted font-medium">Visiting Hours: 08:00 - 18:30</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-light-text dark:text-dark-text mt-1">
            Visitor Gate Passes
          </h1>
          <p className="text-sm text-light-muted dark:text-dark-muted mt-0.5">
            Pre-register parent and guardian visits, generate QR gate clearances, and view check-in status.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-700/25 transition-all self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Request Visitor Pass</span>
        </button>
      </div>

      {/* ── Security Guidelines Banner ────────────────────────────────────── */}
      <div className="card p-4 bg-cyan-500/5 border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="font-bold text-light-text dark:text-dark-text">Campus Security Gate Protocol</p>
            <p className="text-light-muted dark:text-dark-muted">Visitors must present government photo ID at Main Gate 1 turnstile for biometric clearance.</p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-cyan-500 dark:text-cyan-400 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 self-start sm:self-auto whitespace-nowrap">
          Max 5 Guests per Pass
        </span>
      </div>

      {/* ── Passes Grid ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-20 text-center text-light-muted dark:text-dark-muted">
          <Clock size={32} className="animate-spin text-cyan-500 mx-auto mb-2" />
          <p className="text-sm font-semibold">Loading visitor records...</p>
        </div>
      ) : visitors.length === 0 ? (
        <div className="card py-16 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto">
            <Users size={32} />
          </div>
          <h3 className="text-base font-bold text-light-text dark:text-dark-text">No active visitor passes</h3>
          <p className="text-xs text-light-muted dark:text-dark-muted max-w-sm mx-auto">
            When family or relatives visit you at BIT Hostel, create a digital pass here for instant gate clearance.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors"
          >
            <Plus size={15} />
            <span>Create First Pass</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visitors.map((pass) => (
            <motion.div
              key={pass._id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-5 space-y-4 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-500 dark:text-cyan-400">
                    {pass.visitorNumber || `VIS-${pass._id?.slice(-4)}`}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(pass.status)}`}>
                    {pass.status || "approved"}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                    <QrCode size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-light-text dark:text-dark-text truncate">
                      {pass.name || pass.visitorName || "Guest Visitor"}
                    </h3>
                    <p className="text-xs font-semibold text-light-muted dark:text-dark-muted">
                      {pass.relationship || pass.relation || "Parent"} • {pass.phone || pass.visitorPhone}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/60 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-light-muted dark:text-dark-muted">Visit Date:</span>
                    <span className="font-bold text-light-text dark:text-dark-text">
                      {new Date(pass.visitDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-muted dark:text-dark-muted">Time Window:</span>
                    <span className="font-semibold text-light-text dark:text-dark-text">
                      {pass.expectedTimeIn || "10:00 AM"} - {pass.expectedTimeOut || "04:00 PM"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-light-muted dark:text-dark-muted">ID Verification:</span>
                    <span className="font-mono text-light-text dark:text-dark-text truncate max-w-[150px]">
                      {pass.idProofType || "Aadhaar"} {pass.idProofNumber ? `(${pass.idProofNumber})` : ""}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-light-muted dark:text-dark-muted line-clamp-2">
                  <strong className="text-light-text dark:text-dark-text">Purpose:</strong> {pass.purpose || pass.visitPurpose || "Campus Visit"}
                </p>
              </div>

              <div className="pt-3 border-t border-light-border dark:border-dark-border/60 flex items-center justify-between">
                <button
                  onClick={() => deleteMutation.mutate(pass._id)}
                  disabled={deleteMutation.isPending}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors p-1"
                  title="Cancel Pass"
                >
                  <Trash2 size={13} />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={() => setSelectedPass(pass)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors"
                >
                  <QrCode size={13} />
                  <span>Show Pass</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Modal: Request Visitor Pass ───────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-xl rounded-3xl bg-light-surface dark:bg-slate-900 border border-light-border dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-light-border dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-light-text dark:text-dark-text font-display">
                      Request Visitor Gate Pass
                    </h2>
                    <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">Pre-register guests for campus entry</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-light-muted hover:text-light-text hover:bg-light-elevated dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 sm:p-8 space-y-4.5 overflow-y-auto flex-1 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-xs uppercase tracking-wider text-light-text dark:text-dark-text block mb-2">
                        Visitor Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Kumar"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full h-11 px-4 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text focus:outline-none focus:border-cyan-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-xs uppercase tracking-wider text-light-text dark:text-dark-text block mb-2">
                        Relationship
                      </label>
                      <select
                        value={formData.relationship}
                        onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text focus:outline-none focus:border-cyan-500 text-sm"
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Parent">Parent</option>
                        <option value="Guardian">Local Guardian</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Relative">Relative</option>
                        <option value="Friend">Friend</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-xs uppercase tracking-wider text-light-text dark:text-dark-text block mb-2">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 01234"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="w-full h-11 px-4 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text focus:outline-none focus:border-cyan-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-xs uppercase tracking-wider text-light-text dark:text-dark-text block mb-2">
                        Date of Visit
                      </label>
                      <input
                        type="date"
                        value={formData.visitDate}
                        onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                        required
                        className="w-full h-11 px-4 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text focus:outline-none focus:border-cyan-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-xs uppercase tracking-wider text-light-text dark:text-dark-text block mb-2">
                        Expected In Time
                      </label>
                      <input
                        type="text"
                        placeholder="10:00 AM"
                        value={formData.expectedTimeIn}
                        onChange={(e) => setFormData({ ...formData, expectedTimeIn: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text focus:outline-none focus:border-cyan-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-xs uppercase tracking-wider text-light-text dark:text-dark-text block mb-2">
                        Expected Out Time
                      </label>
                      <input
                        type="text"
                        placeholder="04:00 PM"
                        value={formData.expectedTimeOut}
                        onChange={(e) => setFormData({ ...formData, expectedTimeOut: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text focus:outline-none focus:border-cyan-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-xs uppercase tracking-wider text-light-text dark:text-dark-text block mb-2">
                        ID Proof Type
                      </label>
                      <select
                        value={formData.idProofType}
                        onChange={(e) => setFormData({ ...formData, idProofType: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text focus:outline-none focus:border-cyan-500 text-sm"
                      >
                        <option value="Aadhaar">Aadhaar Card</option>
                        <option value="PAN">PAN Card</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving License">Driving License</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-xs uppercase tracking-wider text-light-text dark:text-dark-text block mb-2">
                        ID Number (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 5432-1234-9876"
                        value={formData.idProofNumber}
                        onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text focus:outline-none focus:border-cyan-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-xs uppercase tracking-wider text-light-text dark:text-dark-text block mb-2">
                      Purpose of Visit *
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Family visit & dropping winter essentials"
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      required
                      className="w-full p-4 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text focus:outline-none focus:border-cyan-500 text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="px-6 sm:px-8 py-4.5 border-t border-light-border dark:border-slate-800 flex items-center justify-end gap-3 flex-shrink-0 bg-light-elevated/20 dark:bg-slate-800/40">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-11 px-6 rounded-xl text-slate-300 hover:bg-slate-800/80 font-semibold text-sm transition-colors flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="h-11 px-7 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Clock size={15} className="animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        <span>Generate Pass</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Digital Pass Viewer ────────────────────────────────────── */}
      <AnimatePresence>
        {selectedPass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-200 text-center p-6 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">BIT Security Clearance</span>
                <button onClick={() => setSelectedPass(null)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="w-36 h-36 mx-auto bg-white p-3 rounded-2xl flex items-center justify-center shadow-lg">
                <QrCode size={110} className="text-slate-900" />
              </div>

              <div className="space-y-1">
                <p className="text-lg font-black font-display text-white">
                  {selectedPass.name || selectedPass.visitorName}
                </p>
                <p className="text-xs text-cyan-400 font-bold">
                  {selectedPass.visitorNumber || `VIS-${selectedPass._id?.slice(-4)}`}
                </p>
                <p className="text-xs text-slate-400">
                  Visiting {selectedPass.student?.user?.name || user?.name || "Student"}
                  {selectedPass.student?.room ? ` • Room ${selectedPass.student.room}` : ""}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-left text-xs space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Valid on:</span>
                  <span className="font-semibold text-white">
                    {new Date(selectedPass.visitDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time:</span>
                  <span>{selectedPass.expectedTimeIn} - {selectedPass.expectedTimeOut}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span>{selectedPass.phone || selectedPass.visitorPhone}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  toast.success("Visitor Gate Pass saved!");
                  setSelectedPass(null);
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-cyan-600 text-white hover:bg-cyan-500 shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Download size={14} />
                <span>Download Pass</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisitorPage;
