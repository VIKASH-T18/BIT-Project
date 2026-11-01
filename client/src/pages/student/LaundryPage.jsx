/**
 * @file LaundryPage.jsx
 * @description BIT Smart Laundromat Management with machine availability radar,
 * slot reservation, active wash progress tracking, and monthly quota counter.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shirt, Clock, CheckCircle2, AlertCircle, Plus,
  Sparkles, RefreshCw, X, ArrowRight, Zap, QrCode
} from "lucide-react";
import toast from "react-hot-toast";

const MACHINES = [
  { id: "W1", name: "Washer 01", type: "washer", capacity: "8 KG", status: "available" },
  { id: "W2", name: "Washer 02", type: "washer", capacity: "8 KG", status: "running", remainingMinutes: 18 },
  { id: "W3", name: "Washer 03", type: "washer", capacity: "10 KG (Heavy)", status: "available" },
  { id: "W4", name: "Washer 04", type: "washer", capacity: "8 KG", status: "running", remainingMinutes: 32 },
  { id: "D1", name: "Dryer 01",  type: "dryer",  capacity: "10 KG", status: "available" },
  { id: "D2", name: "Dryer 02",  type: "dryer",  capacity: "10 KG", status: "running", remainingMinutes: 12 },
];

const LaundryPage = () => {
  const [machines, setMachines] = useState(MACHINES);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [timeSlot, setTimeSlot] = useState("16:00 - 17:00");
  const [washType, setWashType] = useState("normal");

  const [activeBatch, setActiveBatch] = useState({
    id: "LND-2026-081",
    machine: "Washer 03",
    status: "washing", // "booked" | "washing" | "drying" | "ready"
    startedAt: "10:15 AM",
    expectedFinish: "11:00 AM",
    itemsCount: 14,
  });

  const handleBookSlot = (e) => {
    e.preventDefault();
    toast.success(`Slot reserved successfully for ${selectedMachine?.name || "Washer 01"} at ${timeSlot}!`);
    setIsBookModalOpen(false);
    setActiveBatch({
      id: `LND-2026-${Math.floor(100 + Math.random() * 899)}`,
      machine: selectedMachine?.name || "Washer 01",
      status: "booked",
      startedAt: timeSlot.split(" - ")[0],
      expectedFinish: timeSlot.split(" - ")[1],
      itemsCount: 12,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
              Hostel Facility • Ground Floor Block A
            </span>
            <span className="text-xs text-light-muted dark:text-dark-muted font-medium">Daily 06:00 - 22:30</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-light-text dark:text-dark-text mt-1">
            Smart Laundromat
          </h1>
          <p className="text-sm text-light-muted dark:text-dark-muted mt-0.5">
            Monitor real-time machine availability, reserve washing slots, and track load cycles.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedMachine(machines.find((m) => m.status === "available") || machines[0]);
            setIsBookModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-700/25 transition-all self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Book Laundry Slot</span>
        </button>
      </div>

      {/* ── KPI & Active Batch Status ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Token Balance */}
        <div className="card p-5 space-y-1">
          <span className="text-xs text-light-muted dark:text-dark-muted font-semibold">Monthly Wash Quota</span>
          <p className="text-2xl font-black font-display text-light-text dark:text-dark-text">18 / 25 Loads</p>
          <div className="w-full h-2 rounded-full bg-light-elevated dark:bg-slate-800 overflow-hidden mt-2">
            <div className="w-[72%] h-full rounded-full bg-cyan-500" />
          </div>
          <p className="text-[11px] text-light-muted dark:text-dark-muted pt-1">7 loads remaining this month</p>
        </div>

        {/* Active Batch Tracker (Span 2) */}
        <div className="md:col-span-2 card p-5 flex flex-col justify-between space-y-3 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border-cyan-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                {activeBatch.id} • {activeBatch.machine}
              </span>
            </div>
            <span className="text-xs text-light-muted dark:text-dark-muted font-semibold">
              Finish: {activeBatch.expectedFinish}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              { id: "booked", label: "Slot Booked" },
              { id: "washing", label: "Washing Cycle" },
              { id: "drying", label: "Spin & Dry" },
              { id: "ready", label: "Ready for Pickup" },
            ].map((step, idx) => {
              const isCurrent = activeBatch.status === step.id;
              const isPast =
                (step.id === "booked") ||
                (step.id === "washing" && ["washing", "drying", "ready"].includes(activeBatch.status)) ||
                (step.id === "drying" && ["drying", "ready"].includes(activeBatch.status));
              return (
                <div key={step.id} className="space-y-1">
                  <div className={`h-1.5 rounded-full ${isPast ? "bg-cyan-500" : "bg-slate-700"}`} />
                  <p className={`text-[11px] font-bold ${isCurrent ? "text-cyan-400" : isPast ? "text-slate-300" : "text-slate-500"}`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-light-muted dark:text-dark-muted">
            14 items loaded. SMS & push notification will be sent when your basket is ready at Counter A.
          </p>
        </div>
      </div>

      {/* ── Machines Availability Grid ─────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-display text-light-text dark:text-dark-text flex items-center gap-2">
            <Shirt size={18} className="text-cyan-500" />
            Machine Availability Live Radar
          </h2>
          <span className="text-xs text-emerald-400 font-bold">
            {machines.filter((m) => m.status === "available").length} Available Right Now
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map((machine) => {
            const isAvail = machine.status === "available";
            return (
              <div
                key={machine.id}
                className={`card p-5 space-y-3 transition-all ${
                  isAvail ? "border-emerald-500/30 hover:border-emerald-500/60" : "opacity-90"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
                      isAvail ? "bg-emerald-600" : "bg-cyan-700"
                    }`}>
                      {machine.id}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-light-text dark:text-dark-text">{machine.name}</h3>
                      <p className="text-xs text-light-muted dark:text-dark-muted">{machine.capacity}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    isAvail ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" :
                    "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25"
                  }`}>
                    {isAvail ? "Available" : `${machine.remainingMinutes}m left`}
                  </span>
                </div>

                <div className="pt-2 border-t border-light-border dark:border-dark-border/40 flex items-center justify-between">
                  <span className="text-xs text-light-muted dark:text-dark-muted">
                    {machine.type === "washer" ? "Digital Inverter Washer" : "Heated Air Dryer"}
                  </span>

                  {isAvail ? (
                    <button
                      onClick={() => {
                        setSelectedMachine(machine);
                        setIsBookModalOpen(true);
                      }}
                      className="px-3 py-1 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all"
                    >
                      Book Now
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-cyan-400">In cycle</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modal: Slot Booking ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isBookModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-200 overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-800 flex-shrink-0 bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Shirt size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white font-display">Reserve Laundromat Slot</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Select machine, wash cycle, and available slot</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBookModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleBookSlot} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 sm:p-8 space-y-5 text-sm overflow-y-auto flex-1">
                  <div>
                    <label className="font-bold text-xs uppercase tracking-wider block mb-2 text-slate-300">
                      Selected Machine
                    </label>
                    <div className="h-12 px-4 rounded-xl bg-slate-800/90 border border-slate-700 font-bold text-white flex items-center justify-between">
                      <span>{selectedMachine?.name}</span>
                      <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                        {selectedMachine?.capacity}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-xs uppercase tracking-wider block mb-2 text-slate-300">
                      Choose Wash Cycle
                    </label>
                    <div className="grid grid-cols-2 gap-3.5">
                      {[
                        { id: "normal", label: "Normal (35 min)" },
                        { id: "heavy", label: "Heavy / Blankets (50 min)" },
                      ].map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setWashType(w.id)}
                          className={`h-13 px-4 rounded-xl border flex items-center justify-center text-center font-bold text-sm transition-all ${
                            washType === w.id
                              ? "bg-cyan-600/20 border-cyan-500 text-cyan-400 shadow-sm"
                              : "bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-xs uppercase tracking-wider block mb-2 text-slate-300">
                      Select Time Slot Today
                    </label>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 text-sm"
                    >
                      <option value="16:00 - 17:00">16:00 - 17:00 (Today Evening)</option>
                      <option value="17:00 - 18:00">17:00 - 18:00 (Today Evening)</option>
                      <option value="19:00 - 20:00">19:00 - 20:00 (Night Slot)</option>
                      <option value="20:00 - 21:00">20:00 - 21:00 (Night Slot)</option>
                    </select>
                  </div>
                </div>

                <div className="px-6 sm:px-8 py-4.5 border-t border-slate-800 bg-slate-900/60 flex-shrink-0">
                  <button
                    type="submit"
                    className="w-full h-12 rounded-xl font-bold text-sm bg-cyan-600 text-white hover:bg-cyan-500 shadow-md shadow-cyan-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    Confirm Reservation (1 Load Deducted)
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

export default LaundryPage;
