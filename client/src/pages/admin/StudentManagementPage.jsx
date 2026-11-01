/**
 * @file StudentManagementPage.jsx
 * @description Admin student management — searchable, filterable list with
 * comprehensive student detail modal on click.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Filter, GraduationCap, Home, CheckCircle,
  Clock, XCircle, AlertTriangle, ChevronRight, BarChart3, ClipboardList,
  X, Phone, Mail, MapPin, Building2, Shield, Heart, Star,
  FileText, BedDouble, Copy, Layers, Calendar, Check, ExternalLink,
  Award, HeartHandshake, UserCheck
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import SkeletonCard from "../../components/common/SkeletonCard";
import DocumentVerificationPage from "./DocumentVerificationPage";
import StudentApprovalPage from "../warden/StudentApprovalPage";

// ─── Hostel Status Badge ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  not_applied: { label: "Not Applied",  cls: "badge-gray",    icon: XCircle,       bgCls: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
  pending:     { label: "Pending",      cls: "badge-warning", icon: Clock,         bgCls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  approved:    { label: "Approved",     cls: "badge-success", icon: CheckCircle,   bgCls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  rejected:    { label: "Rejected",     cls: "badge-error",   icon: XCircle,       bgCls: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  waitlisted:  { label: "Waitlisted",   cls: "badge-purple",  icon: AlertTriangle, bgCls: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  allocated:   { label: "Allocated",    cls: "badge-success", icon: Home,          bgCls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  checked_in:  { label: "Checked In",   cls: "badge-info",    icon: CheckCircle,   bgCls: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  checked_out: { label: "Checked Out",  cls: "badge-gray",    icon: XCircle,       bgCls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
};

// ─── Student Row ──────────────────────────────────────────────────────────────
const StudentRow = ({ student, onSelect }) => {
  const status = STATUS_CONFIG[student.hostelStatus] || STATUS_CONFIG.not_applied;
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onSelect(student)}
      className="flex items-center gap-4 p-4 rounded-xl hover:bg-light-elevated dark:hover:bg-dark-elevated transition-all cursor-pointer group hover:shadow-sm"
    >
      <img
        src={student.user?.profileUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.user?.name || "S")}&background=2563eb&color=fff`}
        alt={student.user?.name}
        className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border border-light-border dark:border-dark-border"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-light-text dark:text-dark-text group-hover:text-blue-500 transition-colors truncate">
            {student.user?.name || "Unknown"}
          </p>
          {student.cgpa && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
              CGPA {student.cgpa}
            </span>
          )}
        </div>
        <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
          {student.registerNumber} • {student.department} • Year {student.year} {student.section ? `• Sec ${student.section}` : ""}
        </p>
      </div>

      <div className="hidden sm:flex items-center gap-1 text-xs">
        <span className={`badge ${status.cls} flex items-center gap-1`}>
          <StatusIcon size={11} />
          {status.label}
        </span>
      </div>

      {student.currentAllocation && (
        <div className="hidden md:block text-right text-xs text-light-muted dark:text-dark-muted">
          <p className="font-semibold text-light-text dark:text-dark-text">Room {student.currentAllocation.room?.roomNumber || "—"}</p>
          <p>Bed {student.currentAllocation.bedNumber || "—"}</p>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-light-muted dark:text-dark-muted group-hover:text-blue-500 transition-colors">
        <span className="hidden lg:inline text-[11px] font-semibold">View Details</span>
        <ChevronRight size={14} className="flex-shrink-0" />
      </div>
    </motion.div>
  );
};

// ─── Student Detail Modal ─────────────────────────────────────────────────────
const StudentDetailModal = ({ studentId, onClose }) => {
  const [copiedKey, setCopiedKey] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["student-detail", studentId],
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}`);
      return res.data.data;
    },
    enabled: !!studentId,
  });

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const student = data?.student;
  const applications = data?.applications || [];
  const statusCfg = STATUS_CONFIG[student?.hostelStatus] || STATUS_CONFIG.not_applied;
  const StatusIcon = statusCfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-2xl p-6 sm:p-7 space-y-6"
      >
        {isLoading ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-sm text-light-muted dark:text-dark-muted">Loading student information...</p>
          </div>
        ) : !student ? (
          <div className="py-12 text-center">
            <p className="text-light-text dark:text-dark-text font-bold">Student details not found</p>
            <button onClick={onClose} className="btn btn-secondary mt-4">Close</button>
          </div>
        ) : (
          <>
            {/* ── Header with Avatar & Status ── */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-light-border dark:border-dark-border">
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={student.user?.profileUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.user?.name || "S")}&background=2563eb&color=fff`}
                  alt={student.user?.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/20 shadow-md flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black font-display text-light-text dark:text-dark-text truncate">
                      {student.user?.name || "Student"}
                    </h2>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusCfg.bgCls}`}>
                      <StatusIcon size={12} />
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-blue-500 mt-0.5 tracking-wider">
                    {student.registerNumber}
                  </p>
                  <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                    {student.department} • Year {student.year} {student.section ? `• Section ${student.section}` : ""} {student.semester ? `• Sem ${student.semester}` : ""}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-light-muted hover:text-light-text hover:bg-light-elevated dark:hover:bg-dark-elevated transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Key Highlights Strip ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border text-center">
                <p className="text-[11px] text-light-muted dark:text-dark-muted uppercase font-bold tracking-wider">CGPA</p>
                <p className="text-lg font-black text-light-text dark:text-dark-text mt-0.5">{student.cgpa || "—"}</p>
              </div>
              <div className="p-3 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border text-center">
                <p className="text-[11px] text-light-muted dark:text-dark-muted uppercase font-bold tracking-wider">Gender</p>
                <p className="text-lg font-black text-light-text dark:text-dark-text mt-0.5 capitalize">{student.gender || "—"}</p>
              </div>
              <div className="p-3 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border text-center">
                <p className="text-[11px] text-light-muted dark:text-dark-muted uppercase font-bold tracking-wider">Blood Group</p>
                <p className="text-lg font-black text-rose-500 mt-0.5">{student.bloodGroup || "—"}</p>
              </div>
              <div className="p-3 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border text-center">
                <p className="text-[11px] text-light-muted dark:text-dark-muted uppercase font-bold tracking-wider">Distance</p>
                <p className="text-lg font-black text-emerald-500 mt-0.5">
                  {student.distanceFromCollege ? `${student.distanceFromCollege} km` : "—"}
                </p>
              </div>
            </div>

            {/* ── Current Hostel Allocation ── */}
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home size={16} className="text-blue-500" />
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">Hostel & Room Allocation</p>
                </div>
                {student.currentAllocation && (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Active Allocation
                  </span>
                )}
              </div>

              {student.currentAllocation ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <p className="text-[11px] text-light-muted dark:text-dark-muted">Hostel</p>
                    <p className="text-sm font-bold text-light-text dark:text-dark-text">
                      {student.currentAllocation.hostel?.name || "BIT Hostel"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-light-muted dark:text-dark-muted">Block</p>
                    <p className="text-sm font-bold text-light-text dark:text-dark-text">
                      {student.currentAllocation.block?.name || student.currentAllocation.block?.blockCode ? `Block ${student.currentAllocation.block?.blockCode || student.currentAllocation.block?.name}` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-light-muted dark:text-dark-muted">Room No.</p>
                    <p className="text-sm font-black text-blue-500">
                      {student.currentAllocation.room?.roomNumber || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-light-muted dark:text-dark-muted">Bed Number</p>
                    <p className="text-sm font-bold text-light-text dark:text-dark-text">
                      Bed {student.currentAllocation.bedNumber || "—"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-xs text-light-muted dark:text-dark-muted">
                  No active room allocated currently. Status: <strong className="text-light-text dark:text-dark-text capitalize">{statusCfg.label}</strong>.
                </div>
              )}
            </div>

            {/* ── Contact & Communication ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-indigo-500" />
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Contact Details</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] text-light-muted dark:text-dark-muted">Email Address</p>
                    <p className="text-xs font-bold text-light-text dark:text-dark-text truncate mt-0.5">
                      {student.user?.email || "—"}
                    </p>
                  </div>
                  {student.user?.email && (
                    <button
                      onClick={() => copyToClipboard(student.user.email, "email")}
                      className="p-1.5 rounded-lg text-light-muted hover:text-blue-500 transition-colors"
                      title="Copy Email"
                    >
                      {copiedKey === "email" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] text-light-muted dark:text-dark-muted">Student Phone</p>
                    <p className="text-xs font-bold text-light-text dark:text-dark-text mt-0.5">
                      {student.phone || "—"}
                    </p>
                  </div>
                  {student.phone && (
                    <a
                      href={`tel:${student.phone}`}
                      className="p-1.5 rounded-lg text-light-muted hover:text-emerald-500 transition-colors"
                      title="Call Student"
                    >
                      <Phone size={14} />
                    </a>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] text-light-muted dark:text-dark-muted">Parent / Guardian Phone</p>
                    <p className="text-xs font-bold text-light-text dark:text-dark-text mt-0.5">
                      {student.parentPhone || student.parentDetails?.fatherPhone || student.parentDetails?.motherPhone || "—"}
                    </p>
                  </div>
                  {(student.parentPhone || student.parentDetails?.fatherPhone) && (
                    <a
                      href={`tel:${student.parentPhone || student.parentDetails?.fatherPhone}`}
                      className="p-1.5 rounded-lg text-light-muted hover:text-emerald-500 transition-colors"
                      title="Call Parent"
                    >
                      <Phone size={14} />
                    </a>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
                  <p className="text-[11px] text-light-muted dark:text-dark-muted">Emergency Contact</p>
                  <p className="text-xs font-bold text-light-text dark:text-dark-text mt-0.5">
                    {student.emergencyContact?.name ? `${student.emergencyContact.name} (${student.emergencyContact.relation || "Relative"}) • ${student.emergencyContact.phone}` : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Address & Residence ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-amber-500" />
                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Permanent Residence</p>
              </div>

              <div className="p-4 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border space-y-2">
                <p className="text-xs text-light-text dark:text-dark-text leading-relaxed">
                  {student.homeAddress || "Address not specified"}
                </p>
                <div className="flex items-center gap-4 text-xs text-light-muted dark:text-dark-muted pt-1">
                  <span>City: <strong className="text-light-text dark:text-dark-text">{student.nativeCity || "—"}</strong></span>
                  <span>State: <strong className="text-light-text dark:text-dark-text">{student.nativeState || "—"}</strong></span>
                  <span>PIN: <strong className="text-light-text dark:text-dark-text">{student.pincode || "—"}</strong></span>
                </div>
              </div>
            </div>

            {/* ── Special Priorities & Category ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield size={15} className="text-purple-500" />
                <p className="text-xs font-bold text-purple-500 uppercase tracking-wider">Priority & Special Categories</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-3.5 rounded-2xl border ${student.isScholarshipHolder ? "bg-purple-500/10 border-purple-500/30" : "bg-light-elevated dark:bg-dark-elevated border-light-border dark:border-dark-border"}`}>
                  <p className="text-xs font-bold text-light-text dark:text-dark-text flex items-center gap-1.5">
                    <Star size={13} className={student.isScholarshipHolder ? "text-purple-400" : "text-light-muted"} />
                    Scholarship Holder
                  </p>
                  <p className="text-[11px] text-light-muted dark:text-dark-muted mt-1">
                    {student.isScholarshipHolder ? (student.scholarshipDetails || "Verified Scholar") : "No"}
                  </p>
                </div>

                <div className={`p-3.5 rounded-2xl border ${student.hasDisability ? "bg-purple-500/10 border-purple-500/30" : "bg-light-elevated dark:bg-dark-elevated border-light-border dark:border-dark-border"}`}>
                  <p className="text-xs font-bold text-light-text dark:text-dark-text flex items-center gap-1.5">
                    <Shield size={13} className={student.hasDisability ? "text-purple-400" : "text-light-muted"} />
                    Physical Disability
                  </p>
                  <p className="text-[11px] text-light-muted dark:text-dark-muted mt-1">
                    {student.hasDisability ? (student.disabilityDetails || "Yes (Special consideration)") : "None"}
                  </p>
                </div>

                <div className={`p-3.5 rounded-2xl border ${student.hasMedicalCondition ? "bg-purple-500/10 border-purple-500/30" : "bg-light-elevated dark:bg-dark-elevated border-light-border dark:border-dark-border"}`}>
                  <p className="text-xs font-bold text-light-text dark:text-dark-text flex items-center gap-1.5">
                    <Heart size={13} className={student.hasMedicalCondition ? "text-rose-400" : "text-light-muted"} />
                    Medical Condition
                  </p>
                  <p className="text-[11px] text-light-muted dark:text-dark-muted mt-1">
                    {student.hasMedicalCondition ? (student.medicalDetails || "Yes") : "None reported"}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Applications History ── */}
            {applications.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-blue-500" />
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">Hostel Applications History</p>
                </div>

                <div className="space-y-2">
                  {applications.map((app) => (
                    <div
                      key={app._id}
                      className="p-3 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-light-text dark:text-dark-text">
                          Academic Year: {app.academicYear}
                          {app.preferredBlock?.blockCode && ` • Block ${app.preferredBlock.blockCode}`}
                          {app.preferredRoomType && ` • ${app.preferredRoomType.replace("_", " ")}`}
                        </p>
                        <p className="text-[11px] text-light-muted dark:text-dark-muted mt-0.5">
                          Submitted: {new Date(app.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {app.priorityScore ? ` • Priority Score: ${app.priorityScore}` : ""}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                        app.status === "allocated" ? "bg-blue-500/15 text-blue-400" :
                        app.status === "approved" ? "bg-emerald-500/15 text-emerald-400" :
                        app.status === "rejected" ? "bg-rose-500/15 text-rose-400" :
                        "bg-amber-500/15 text-amber-400"
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Modal Footer ── */}
            <div className="pt-2 flex justify-end">
              <button onClick={onClose} className="btn btn-secondary px-6">
                Close
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const StudentManagementPage = () => {
  const [activeTab, setActiveTab] = useState("directory"); // "directory" | "documents"
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [filters, setFilters] = useState({
    department: "",
    year: "",
    gender: "",
    hostelStatus: "",
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["all-students", filters, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ ...filters, search, page, limit: 20 });
      const { data } = await api.get(`/students?${params}`);
      return data.data;
    },
    keepPreviousData: true,
  });

  const updateFilter = (key, val) => { setFilters((f) => ({ ...f, [key]: val })); setPage(1); };

  const students = data?.students || [];
  const pagination = data?.pagination || {};
  const hostelCounts = data?.hostelStatusCounts || {};

  const statusCards = [
    { key: "allocated",   label: "Allocated",     icon: Home,          color: "from-green-500 to-emerald-600" },
    { key: "pending",     label: "Pending",        icon: Clock,         color: "from-yellow-500 to-orange-500" },
    { key: "waitlisted",  label: "Waitlisted",     icon: AlertTriangle, color: "from-purple-500 to-violet-600" },
    { key: "not_applied", label: "Not Applied",    icon: XCircle,       color: "from-gray-500 to-slate-600" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header & Tab Switcher ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-4">
        <div>
          <h1 className="text-2xl font-black font-display text-light-text dark:text-dark-text">Student Management</h1>
          <p className="text-light-muted dark:text-dark-muted text-sm mt-0.5">
            {activeTab === "directory"
              ? `${pagination.total || 0} students registered`
              : activeTab === "approvals"
              ? "Review and approve student hostel applications"
              : "Onboarding credential verification"}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border">
          <button
            onClick={() => setActiveTab("directory")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "directory"
                ? "bg-primary-500 text-white shadow-sm"
                : "text-light-muted hover:text-light-text"
            }`}
          >
            Student Directory
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "approvals"
                ? "bg-primary-500 text-white shadow-sm"
                : "text-light-muted hover:text-light-text"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Hostel Approvals
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "documents"
                ? "bg-primary-500 text-white shadow-sm"
                : "text-light-muted hover:text-light-text"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Document Verification
          </button>
        </div>
      </div>

      {activeTab === "documents" ? (
        <DocumentVerificationPage />
      ) : activeTab === "approvals" ? (
        <StudentApprovalPage />
      ) : (
        <>
          {/* ── Status Summary Cards ──────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statusCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.key}
                  className={`card cursor-pointer hover:shadow-lg transition-shadow ${filters.hostelStatus === card.key ? "ring-2 ring-blue-500" : ""}`}
                  onClick={() => updateFilter("hostelStatus", filters.hostelStatus === card.key ? "" : card.key)}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <p className="text-2xl font-black font-display text-light-text dark:text-dark-text">
                    {hostelCounts[card.key] || 0}
                  </p>
                  <p className="text-sm text-light-muted dark:text-dark-muted">{card.label}</p>
                </div>
              );
            })}
          </div>

          {/* ── Filters ─────────────────────────────────── */}
          <div className="card">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
                <input
                  type="text"
                  placeholder="Search by name, register no, email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="bit-input pl-8"
                />
              </div>

              <select value={filters.department} onChange={(e) => updateFilter("department", e.target.value)} className="bit-input sm:w-36">
                <option value="">All Depts</option>
                {["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIDS", "AIML", "CSD", "IoT"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select value={filters.year} onChange={(e) => updateFilter("year", e.target.value)} className="bit-input sm:w-28">
                <option value="">All Years</option>
                {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>

              <select value={filters.gender} onChange={(e) => updateFilter("gender", e.target.value)} className="bit-input sm:w-28">
                <option value="">All Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          {/* ── Student List ─────────────────────────────── */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold font-display text-light-text dark:text-dark-text flex items-center gap-2">
                <Users size={18} className="text-blue-500" />
                {isLoading ? "Loading..." : `${students.length} students shown`}
              </h3>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} height="64px" />)}
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <Users size={32} className="text-light-border dark:text-dark-border mb-2 mx-auto" />
                <p className="text-light-muted dark:text-dark-muted">No students match the current filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-light-border dark:divide-dark-border">
                {students.map((student) => (
                  <StudentRow
                    key={student._id}
                    student={student}
                    onSelect={(s) => setSelectedStudentId(s._id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Pagination ───────────────────────────────── */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary btn-sm disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm text-light-muted dark:text-dark-muted">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="btn btn-secondary btn-sm disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Student Detail Modal on Click ── */}
      <AnimatePresence>
        {selectedStudentId && (
          <StudentDetailModal
            studentId={selectedStudentId}
            onClose={() => setSelectedStudentId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentManagementPage;
