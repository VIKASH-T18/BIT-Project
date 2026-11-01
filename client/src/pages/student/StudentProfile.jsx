/**
 * @file StudentProfile.jsx
 * @description Comprehensive Student Profile & Academic Record Management
 * with verified credentials, hostel residency details, and contact updater.
 */

import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Building2, Bed, GraduationCap,
  Calendar, ShieldCheck, Edit3, Save, X, Heart, Award,
  Sparkles, CheckCircle2, AlertCircle, FileText
} from "lucide-react";
import toast from "react-hot-toast";

import { selectCurrentUser } from "../../redux/slices/authSlice";
import api from "../../services/api";

const StudentProfile = () => {
  const user = useSelector(selectCurrentUser);
  const userId = user?._id || user?.id;
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("personal"); // "personal" | "academic" | "hostel" | "emergency"

  // Fetch full student profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-student-profile", userId],
    queryFn: async () => {
      const { data } = await api.get("/students/me");
      return data.data;
    },
    enabled: !!userId,
  });

  // Edit form state
  const [formData, setFormData] = useState({
    phone: "",
    parentPhone: "",
    nativeCity: "",
    nativeState: "",
    homeAddress: "",
    bloodGroup: "O+",
    bio: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  // Sync state once profile is loaded
  const handleStartEdit = () => {
    setFormData({
      phone: profile?.phone || "+91 98765 43212",
      parentPhone: profile?.parentPhone || "+91 98765 43213",
      nativeCity: profile?.nativeCity || "Coimbatore",
      nativeState: profile?.nativeState || "Tamil Nadu",
      homeAddress: profile?.homeAddress || "12, College Road, Coimbatore - 641001",
      bloodGroup: profile?.bloodGroup || "O+",
      bio: profile?.bio || "Third-year Computer Science & Engineering student at BIT Sathyamangalam.",
      emergencyContactName: profile?.emergencyContact?.name || "R. Kumar",
      emergencyContactPhone: profile?.emergencyContact?.phone || "+91 98765 43213",
    });
    setIsEditing(true);
  };

  // Mutation to update profile
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put("/students/me", {
        ...payload,
        emergencyContact: {
          name: payload.emergencyContactName,
          relation: "Father",
          phone: payload.emergencyContactPhone,
        },
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      queryClient.invalidateQueries(["my-student-profile"]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const studentName = profile?.user?.name || user?.name || "Arjun Kumar";
  const studentEmail = profile?.user?.email || user?.email || "student1@bitsathy.ac.in";
  const regNo = profile?.registerNumber || "7376221CS001";
  const dept = profile?.department || "CSE";
  const year = profile?.year || 3;
  const sem = profile?.semester || 5;
  const section = profile?.section || "A";
  const cgpa = profile?.cgpa || 8.75;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* ── Top Hero Profile Header ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
        style={{
          background: "linear-gradient(135deg, rgba(30, 58, 138, 0.5) 0%, rgba(15, 23, 42, 0.95) 100%)",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          boxShadow: "0 10px 40px -10px rgba(37, 99, 235, 0.25)",
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-700 p-0.5 shadow-xl">
                <img
                  src={profile?.user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=2563eb&color=fff&size=128`}
                  alt={studentName}
                  className="w-full h-full object-cover rounded-[14px]"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white shadow-md" title="Verified Institutional Student">
                <ShieldCheck size={14} />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {dept} • Year {year}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Resident: Room A101
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
                {studentName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-mono">
                {regNo} • {studentEmail}
              </p>
            </div>
          </div>

          <div>
            {!isEditing ? (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all"
              >
                <Edit3 size={15} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/10 hover:bg-white/15 transition-all"
              >
                <X size={15} />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI ribbon */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Cumulative GPA</span>
            <span className="text-base font-black text-emerald-400 font-display">{cgpa} / 10.0</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Current Semester</span>
            <span className="text-base font-black text-white font-display">Sem {sem} (Sec {section})</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Hostel Status</span>
            <span className="text-base font-black text-blue-400 font-display">Allocated & Active</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Blood Group</span>
            <span className="text-base font-black text-rose-400 font-display">{profile?.bloodGroup || "O+"}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Navigation Tabs ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-light-elevated/70 dark:bg-dark-elevated/70 border border-light-border dark:border-dark-border/60 overflow-x-auto">
        {[
          { id: "personal", label: "Personal Details", icon: User },
          { id: "academic", label: "Academic Info", icon: GraduationCap },
          { id: "hostel", label: "Hostel & Room", icon: Building2 },
          { id: "emergency", label: "Emergency Contacts", icon: Heart },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                  : "text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────────── */}
      <div className="card p-6">
        {activeTab === "personal" && (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border/60 pb-3">
              <h3 className="text-base font-bold text-light-text dark:text-dark-text font-display">
                Personal & Contact Information
              </h3>
              {isEditing && (
                <span className="text-xs text-amber-500 font-semibold animate-pulse">Editing Mode</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-light-muted dark:text-dark-muted block mb-1">Student Phone Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text"
                  />
                ) : (
                  <p className="text-sm font-semibold text-light-text dark:text-dark-text">{profile?.phone || "+91 98765 43212"}</p>
                )}
              </div>

              <div>
                <label className="font-bold text-light-muted dark:text-dark-muted block mb-1">Parent Phone Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text"
                  />
                ) : (
                  <p className="text-sm font-semibold text-light-text dark:text-dark-text">{profile?.parentPhone || "+91 98765 43213"}</p>
                )}
              </div>

              <div>
                <label className="font-bold text-light-muted dark:text-dark-muted block mb-1">Native City</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.nativeCity}
                    onChange={(e) => setFormData({ ...formData, nativeCity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text"
                  />
                ) : (
                  <p className="text-sm font-semibold text-light-text dark:text-dark-text">{profile?.nativeCity || "Coimbatore"}</p>
                )}
              </div>

              <div>
                <label className="font-bold text-light-muted dark:text-dark-muted block mb-1">Native State</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.nativeState}
                    onChange={(e) => setFormData({ ...formData, nativeState: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text"
                  />
                ) : (
                  <p className="text-sm font-semibold text-light-text dark:text-dark-text">{profile?.nativeState || "Tamil Nadu"}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-light-muted dark:text-dark-muted block mb-1">Permanent Residential Address</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={formData.homeAddress}
                    onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text"
                  />
                ) : (
                  <p className="text-sm font-semibold text-light-text dark:text-dark-text">{profile?.homeAddress || "12, College Road, Coimbatore - 641001"}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-light-muted dark:text-dark-muted block mb-1">Bio & Hobbies</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-light-elevated dark:bg-slate-800 border border-light-border dark:border-slate-700 text-light-text dark:text-dark-text"
                  />
                ) : (
                  <p className="text-sm font-semibold text-light-text dark:text-dark-text">{profile?.bio || "Competitive programming enthusiast, badminton player, and tech builder."}</p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-2 pt-3 border-t border-light-border dark:border-dark-border/60">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30"
                >
                  <Save size={14} />
                  <span>{updateMutation.isPending ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            )}
          </form>
        )}

        {activeTab === "academic" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-light-text dark:text-dark-text font-display border-b border-light-border dark:border-dark-border/60 pb-3">
              Official Academic Records
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/60">
                <span className="text-light-muted dark:text-dark-muted block">Register Number</span>
                <span className="text-sm font-bold font-mono text-light-text dark:text-dark-text">{regNo}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/60">
                <span className="text-light-muted dark:text-dark-muted block">Roll Number</span>
                <span className="text-sm font-bold font-mono text-light-text dark:text-dark-text">{profile?.rollNumber || "21CSE001"}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/60">
                <span className="text-light-muted dark:text-dark-muted block">Department</span>
                <span className="text-sm font-bold text-light-text dark:text-dark-text">Computer Science & Engineering</span>
              </div>
              <div className="p-3.5 rounded-xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/60">
                <span className="text-light-muted dark:text-dark-muted block">Admission Batch</span>
                <span className="text-sm font-bold text-light-text dark:text-dark-text">2022 - 2026</span>
              </div>
              <div className="p-3.5 rounded-xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/60">
                <span className="text-light-muted dark:text-dark-muted block">Current Academic Year</span>
                <span className="text-sm font-bold text-light-text dark:text-dark-text">2025 - 2026</span>
              </div>
              <div className="p-3.5 rounded-xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/60">
                <span className="text-light-muted dark:text-dark-muted block">Current Standing</span>
                <span className="text-sm font-bold text-emerald-400">First Class with Distinction</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "hostel" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-light-text dark:text-dark-text font-display border-b border-light-border dark:border-dark-border/60 pb-3">
              Hostel Allotment & Room Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                <span className="text-blue-400 font-bold block uppercase tracking-wider text-[10px]">Hostel Residence</span>
                <p className="text-base font-black text-light-text dark:text-dark-text">Emerald Boys Hostel</p>
                <p className="text-xs text-light-muted dark:text-dark-muted">North Quadrangle Campus, BIT</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <span className="text-emerald-400 font-bold block uppercase tracking-wider text-[10px]">Room & Bed</span>
                <p className="text-base font-black text-light-text dark:text-dark-text">Block A • Room A101 (Bed A)</p>
                <p className="text-xs text-light-muted dark:text-dark-muted">Double Sharing • 1st Floor</p>
              </div>

              <div className="p-4 rounded-2xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/60 space-y-1">
                <span className="text-light-muted dark:text-dark-muted block font-semibold">Chief Warden on Duty</span>
                <p className="text-sm font-bold text-light-text dark:text-dark-text">Mr. P. Selvakumar</p>
                <p className="text-xs text-light-muted dark:text-dark-muted">warden.boysa@bitsathy.ac.in</p>
              </div>

              <div className="p-4 rounded-2xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/60 space-y-1">
                <span className="text-light-muted dark:text-dark-muted block font-semibold">Mess Allotment</span>
                <p className="text-sm font-bold text-light-text dark:text-dark-text">Special Mess Hall 2 (Non-Veg / Veg)</p>
                <p className="text-xs text-light-muted dark:text-dark-muted">Timings: 07:30 - 21:00 Daily</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "emergency" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-light-text dark:text-dark-text font-display border-b border-light-border dark:border-dark-border/60 pb-3">
              Emergency Contacts & Guardians
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/60 space-y-2">
                <span className="text-xs font-bold text-light-text dark:text-dark-text flex items-center gap-1.5">
                  <Heart size={14} className="text-rose-500" />
                  Primary Guardian
                </span>
                <p className="text-sm font-bold text-light-text dark:text-dark-text">{formData.emergencyContactName || "R. Kumar"} (Father)</p>
                <p className="text-xs text-light-muted dark:text-dark-muted">{formData.emergencyContactPhone || "+91 98765 43213"}</p>
                <p className="text-xs text-light-muted dark:text-dark-muted">Occupation: Civil Engineer</p>
              </div>

              <div className="p-4 rounded-2xl bg-light-elevated/50 dark:bg-dark-elevated/50 border border-light-border dark:border-dark-border/60 space-y-2">
                <span className="text-xs font-bold text-light-text dark:text-dark-text flex items-center gap-1.5">
                  <Building2 size={14} className="text-blue-500" />
                  Campus Medical Centre
                </span>
                <p className="text-sm font-bold text-light-text dark:text-dark-text">BIT 24/7 Health Clinic</p>
                <p className="text-xs text-light-muted dark:text-dark-muted">Extension: 4100 / +91 94433 11223</p>
                <p className="text-xs text-light-muted dark:text-dark-muted">Location: Next to Emerald Hostel Ground Floor</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
