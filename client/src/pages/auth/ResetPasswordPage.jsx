/**
 * @file ResetPasswordPage.jsx
 * @description Password reset page (token from URL query param).
 */

import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const ResetPasswordPage = () => {
  const [params]    = useSearchParams();
  const navigate    = useNavigate();
  const token       = params.get("token") || "";
  const [pwd, setPwd]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pwd.length < 8)      return toast.error("Password must be at least 8 characters");
    if (pwd !== confirm)     return toast.error("Passwords do not match");
    if (!/[A-Z]/.test(pwd))  return toast.error("Must include an uppercase letter");
    if (!/[0-9]/.test(pwd))  return toast.error("Must include a number");

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: pwd });
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed. Link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="text-center">
      <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={40} className="text-white" />
      </div>
      <h2 className="text-2xl font-black font-display text-light-text dark:text-dark-text mb-2">Password Reset!</h2>
      <p className="text-light-muted dark:text-dark-muted">Redirecting to login...</p>
    </div>
  );

  return (
    <div>
      <h2 className="text-3xl font-black font-display text-light-text dark:text-dark-text mb-2">New Password</h2>
      <p className="text-light-muted dark:text-dark-muted mb-8">Choose a strong password for your account</p>

      {!token && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 text-sm mb-4">
          Invalid reset link. Please request a new one.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-light-text dark:text-dark-text">New Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-3.5 text-light-muted dark:text-dark-muted" />
            <input type={showPwd ? "text" : "password"} value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Min 8 chars" className="input pl-9 pr-9" required />
            <button type="button" onClick={() => setShowPwd((p) => !p)} className="absolute right-3 top-3 text-light-muted dark:text-dark-muted">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-light-text dark:text-dark-text">Confirm Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-3.5 text-light-muted dark:text-dark-muted" />
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" className="input pl-9" required />
          </div>
        </div>
        <button type="submit" disabled={loading || !token} className="btn btn-primary w-full">
          {loading ? <div className="spinner" /> : "Reset Password"}
        </button>
      </form>
      <p className="text-center text-sm text-light-muted dark:text-dark-muted mt-5">
        <Link to="/login" className="text-blue-500 hover:underline">Back to login</Link>
      </p>
    </div>
  );
};

export default ResetPasswordPage;
