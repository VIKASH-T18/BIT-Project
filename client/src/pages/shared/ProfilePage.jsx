/**
 * @file ProfilePage.jsx
 * @description User Account & Profile Settings — view personal records, update contact info.
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, Shield, Building, Home, GraduationCap,
  Save, CheckCircle2, AlertCircle, RefreshCw, KeyRound
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    emergencyContact: "",
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch full profile
  const { data, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await api.get("/users/profile");
      return res.data?.data;
    },
  });

  const user = data?.user || authUser || {};
  const student = data?.student;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        emergencyContact: user.emergencyContact || "",
      });
    }
  }, [user.name, user.phone, user.emergencyContact]);

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.patch("/users/profile", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["user-profile"]);
      setSuccessMsg("Profile updated successfully!");
      setErrorMsg("");
      setTimeout(() => setSuccessMsg(""), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || "Failed to update profile.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto pb-12"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black font-display text-light-text dark:text-dark-text flex items-center gap-3">
          <span className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
            <User className="w-8 h-8" />
          </span>
          My Account Profile
        </h1>
        <p className="text-light-muted dark:text-dark-muted mt-1">
          Manage your personal details, emergency contacts, and residential records.
        </p>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center gap-2 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Profile Card & Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Avatar Card */}
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-primary-500/15 flex items-center justify-center text-primary-600 font-black text-3xl mb-4 border-4 border-light-border dark:border-dark-border">
            {user.name ? user.name.slice(0, 2).toUpperCase() : "US"}
          </div>
          <h2 className="text-xl font-bold text-light-text dark:text-dark-text">
            {user.name || "BIT User"}
          </h2>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
            {user.email}
          </p>
          <span className="mt-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-500/10 text-primary-500 border border-primary-500/20">
            {user.role}
          </span>

          {student && (
            <div className="mt-6 w-full pt-6 border-t border-light-border dark:border-dark-border text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-light-muted dark:text-dark-muted">Reg No:</span>
                <span className="font-bold text-light-text dark:text-dark-text">
                  {student.registerNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-light-muted dark:text-dark-muted">Dept:</span>
                <span className="font-bold text-light-text dark:text-dark-text">
                  {student.department} (Year {student.year})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-light-muted dark:text-dark-muted">Status:</span>
                <span className="font-bold text-primary-500 capitalize">
                  {student.hostelStatus}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Form Card */}
        <div className="md:col-span-2 card p-6">
          <h3 className="text-base font-bold text-light-text dark:text-dark-text border-b border-light-border dark:border-dark-border pb-3 mb-6">
            Contact & Personal Information
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1.5">
                Official Email Address
              </label>
              <input
                type="email"
                disabled
                value={user.email || ""}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-light-surface/50 dark:bg-dark-surface/50 border border-light-border dark:border-dark-border opacity-70 cursor-not-allowed"
              />
              <span className="text-[11px] text-light-muted dark:text-dark-muted mt-1 block">
                Email is managed by college administration.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1.5">
                  Emergency Contact
                </label>
                <input
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="Parent / Guardian phone"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-light-border dark:border-dark-border flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn-primary py-2 px-6 flex items-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
