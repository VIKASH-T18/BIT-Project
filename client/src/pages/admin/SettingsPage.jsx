/**
 * @file SettingsPage.jsx
 * @description Admin Portal & Hostel System Settings — academic cycles, hostel curfew rules,
 * fee policies, auto-allocation toggles, and security configurations.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Sliders, Shield, Bell, DollarSign, Clock, Save, Lock,
  CheckCircle2, AlertCircle, RefreshCw, KeyRound, Building
} from "lucide-react";
import api from "../../services/api";

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Password state
  const [pwdData, setPwdData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwdStatus, setPwdStatus] = useState({ success: "", error: "" });

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await api.get("/admins/settings");
      return res.data?.data;
    },
  });

  const [formState, setFormState] = useState(null);

  // Sync initial query to form state
  const currentSettings = formState || settingsData || {
    academicYear: "2025-2026",
    hostelRegistrationOpen: true,
    autoAllocationEnabled: false,
    curfewTime: "21:30",
    lateFeePerDay: 50,
    maxLeaveDaysPerMonth: 7,
    emailNotifications: true,
    smsAlerts: false,
    maintenanceMode: false,
    allowStudentRoommateMatching: true,
    messFeeDueDayOfMonth: 5,
  };

  const handleFieldChange = (key, value) => {
    setFormState((prev) => ({
      ...(prev || settingsData || {}),
      [key]: value,
    }));
  };

  // Update Settings Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.patch("/admins/settings", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-settings"]);
      setSuccessMsg("System configuration saved successfully.");
      setErrorMsg("");
      setTimeout(() => setSuccessMsg(""), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || "Failed to save settings.");
    },
  });

  // Change Password Mutation
  const pwdMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const res = await api.put("/auth/change-password", { currentPassword, newPassword });
      return res.data;
    },
    onSuccess: () => {
      setPwdStatus({ success: "Password changed successfully!", error: "" });
      setPwdData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPwdStatus({ success: "", error: "" }), 4000);
    },
    onError: (err) => {
      setPwdStatus({
        error: err.response?.data?.message || "Failed to change password.",
        success: "",
      });
    },
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateMutation.mutate(currentSettings);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (pwdData.newPassword.length < 8) {
      setPwdStatus({ error: "New password must be at least 8 characters long.", success: "" });
      return;
    }
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      setPwdStatus({ error: "New passwords do not match.", success: "" });
      return;
    }
    pwdMutation.mutate({
      currentPassword: pwdData.currentPassword,
      newPassword: pwdData.newPassword,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl mx-auto pb-12"
    >
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black font-display text-light-text dark:text-dark-text flex items-center gap-3">
          <span className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
            <Sliders className="w-8 h-8" />
          </span>
          Portal & System Settings
        </h1>
        <p className="text-light-muted dark:text-dark-muted mt-1">
          Configure institutional hostel policies, financial rules, notifications, and administrator credentials.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-1">
        {[
          { id: "general", label: "Hostel & Admissions", icon: Building },
          { id: "financial", label: "Fee & Financial Policies", icon: DollarSign },
          { id: "notifications", label: "Notification Channels", icon: Bell },
          { id: "security", label: "Security & Credentials", icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl transition-all ${
                activeTab === tab.id
                  ? "bg-primary-500 text-white shadow-sm"
                  : "text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Feedback Alerts */}
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

      {/* Tab: Hostel & Admissions */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="card p-6 space-y-6">
            <h3 className="text-base font-bold text-light-text dark:text-dark-text border-b border-light-border dark:border-dark-border pb-3">
              Academic & Allocation Rules
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-2">
                  Current Academic Year
                </label>
                <input
                  type="text"
                  value={currentSettings.academicYear || ""}
                  onChange={(e) => handleFieldChange("academicYear", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500/30"
                  placeholder="e.g. 2025-2026"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-2">
                  Night Curfew Time (24h Format)
                </label>
                <input
                  type="time"
                  value={currentSettings.curfewTime || "21:30"}
                  onChange={(e) => handleFieldChange("curfewTime", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-2">
                  Max Student Leave Days / Month
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={currentSettings.maxLeaveDaysPerMonth || 7}
                  onChange={(e) => handleFieldChange("maxLeaveDaysPerMonth", parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
            </div>

            <div className="border-t border-light-border dark:border-dark-border pt-4 space-y-4">
              <label className="flex items-center justify-between p-3 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border cursor-pointer">
                <div>
                  <p className="text-sm font-bold text-light-text dark:text-dark-text">
                    Hostel Registration & Applications Window
                  </p>
                  <p className="text-xs text-light-muted dark:text-dark-muted">
                    When active, students can apply for hostel rooms and submit preferences.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={!!currentSettings.hostelRegistrationOpen}
                  onChange={(e) => handleFieldChange("hostelRegistrationOpen", e.target.checked)}
                  className="w-5 h-5 accent-primary-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border cursor-pointer">
                <div>
                  <p className="text-sm font-bold text-light-text dark:text-dark-text">
                    AI Roommate Compatibility Matching
                  </p>
                  <p className="text-xs text-light-muted dark:text-dark-muted">
                    Enable compatibility questionnaires and roommate suggestions for applicants.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={!!currentSettings.allowStudentRoommateMatching}
                  onChange={(e) => handleFieldChange("allowStudentRoommateMatching", e.target.checked)}
                  className="w-5 h-5 accent-primary-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border cursor-pointer">
                <div>
                  <p className="text-sm font-bold text-light-text dark:text-dark-text">
                    Maintenance Mode
                  </p>
                  <p className="text-xs text-light-muted dark:text-dark-muted">
                    Locks non-admin portal interactions for scheduled maintenance.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={!!currentSettings.maintenanceMode}
                  onChange={(e) => handleFieldChange("maintenanceMode", e.target.checked)}
                  className="w-5 h-5 accent-primary-500 rounded"
                />
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t border-light-border dark:border-dark-border">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn-primary py-2 px-6 flex items-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? "Saving Changes..." : "Save Policies"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab: Fee & Financial Policies */}
      {activeTab === "financial" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="card p-6 space-y-6">
            <h3 className="text-base font-bold text-light-text dark:text-dark-text border-b border-light-border dark:border-dark-border pb-3">
              Financial & Billing Thresholds
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-2">
                  Late Fee Surcharge (₹ per day overdue)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-light-muted font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={currentSettings.lateFeePerDay || 50}
                    onChange={(e) => handleFieldChange("lateFeePerDay", parseInt(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-2">
                  Mess Fee Due Date (Day of Month)
                </label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={currentSettings.messFeeDueDayOfMonth || 5}
                  onChange={(e) => handleFieldChange("messFeeDueDayOfMonth", parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-light-border dark:border-dark-border">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn-primary py-2 px-6 flex items-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? "Saving..." : "Save Financial Rules"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab: Notification Channels */}
      {activeTab === "notifications" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="card p-6 space-y-6">
            <h3 className="text-base font-bold text-light-text dark:text-dark-text border-b border-light-border dark:border-dark-border pb-3">
              Institutional Dispatch Channels
            </h3>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border cursor-pointer">
                <div>
                  <p className="text-sm font-bold text-light-text dark:text-dark-text">
                    Email Notification Dispatch
                  </p>
                  <p className="text-xs text-light-muted dark:text-dark-muted">
                    Send automated emails for room allotment letters, receipts, and OTP verification.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={!!currentSettings.emailNotifications}
                  onChange={(e) => handleFieldChange("emailNotifications", e.target.checked)}
                  className="w-5 h-5 accent-primary-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border cursor-pointer">
                <div>
                  <p className="text-sm font-bold text-light-text dark:text-dark-text">
                    SMS Emergency Gateway
                  </p>
                  <p className="text-xs text-light-muted dark:text-dark-muted">
                    Trigger urgent parent and warden alerts for unapproved night leaves.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={!!currentSettings.smsAlerts}
                  onChange={(e) => handleFieldChange("smsAlerts", e.target.checked)}
                  className="w-5 h-5 accent-primary-500 rounded"
                />
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t border-light-border dark:border-dark-border">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn-primary py-2 px-6 flex items-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                Save Channels
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab: Security & Password */}
      {activeTab === "security" && (
        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div className="card p-6 space-y-6">
            <h3 className="text-base font-bold text-light-text dark:text-dark-text border-b border-light-border dark:border-dark-border pb-3 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary-500" />
              Change Administrator Password
            </h3>

            {pwdStatus.success && (
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-semibold">
                {pwdStatus.success}
              </div>
            )}
            {pwdStatus.error && (
              <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl text-xs font-semibold">
                {pwdStatus.error}
              </div>
            )}

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={pwdData.currentPassword}
                  onChange={(e) => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500/30"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1.5">
                  New Password (Min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  value={pwdData.newPassword}
                  onChange={(e) => setPwdData({ ...pwdData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500/30"
                  placeholder="Enter new strong password"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={pwdData.confirmPassword}
                  onChange={(e) => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500/30"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            <div className="flex justify-start pt-4 border-t border-light-border dark:border-dark-border">
              <button
                type="submit"
                disabled={pwdMutation.isPending}
                className="btn-primary py-2 px-6 flex items-center gap-2 text-sm"
              >
                <Lock className="w-4 h-4" />
                {pwdMutation.isPending ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </div>
        </form>
      )}
    </motion.div>
  );
};

export default SettingsPage;
