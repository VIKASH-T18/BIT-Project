/**
 * @file ForgotPasswordPage.jsx + ResetPasswordPage.jsx
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Mail, Send, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div className="text-center">
      <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-white" />
      </div>
      <h2 className="text-2xl font-black font-display text-light-text dark:text-dark-text mb-2">Check Your Email</h2>
      <p className="text-light-muted dark:text-dark-muted mb-6">We've sent a password reset link to <strong>{email}</strong></p>
      <Link to="/login" className="btn btn-primary">Back to Login</Link>
    </div>
  );

  return (
    <div>
      <h2 className="text-3xl font-black font-display text-light-text dark:text-dark-text mb-2">Reset Password</h2>
      <p className="text-light-muted dark:text-dark-muted mb-8">Enter your email and we'll send a reset link</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-light-text dark:text-dark-text">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-3.5 text-light-muted dark:text-dark-muted" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yourname@bit.edu.in" className="input pl-9" required />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? <div className="spinner" /> : <><Send size={16} /> Send Reset Link</>}
        </button>
      </form>
      <p className="text-center text-sm text-light-muted dark:text-dark-muted mt-5">
        Remember it? <Link to="/login" className="text-blue-500 hover:underline">Sign in</Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
