/**
 * @file VerifyEmailPage.jsx
 * @description OTP verification page with countdown timer, resend functionality,
 * dev OTP autofill helper, and matching BIT Portal dark theme styling.
 */

import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, RotateCcw, ArrowLeft, Key } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useDispatch } from "react-redux";
import { fetchCurrentUser } from "../../redux/slices/authSlice";

const RESEND_TIMEOUT = 60; // seconds

const VerifyEmailPage = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const email     = location.state?.email || "";
  const name      = location.state?.name || "there";
  const devOtp    = location.state?.devOtp || "";

  const [otp, setOtp]               = useState(["", "", "", "", "", ""]);
  const [loading, setLoading]       = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend]   = useState(false);
  const inputRefs = Array.from({ length: 6 }, () => useRef(null));

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) { setCanResend(true); return; }
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  // Autofill devOtp if present
  useEffect(() => {
    if (devOtp && devOtp.length === 6) {
      setOtp(devOtp.split(""));
    }
  }, [devOtp]);

  const handleInput = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs[index + 1].current?.focus();
    if (newOtp.every((d) => d)) handleVerify(newOtp.join(""));
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      handleVerify(pasted);
    }
  };

  const handleVerify = async (otpValue) => {
    if (!email) {
      toast.error("Email not found. Please register again.");
      navigate("/register");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-email", { email, otp: otpValue });
      if (data.data?.accessToken) {
        localStorage.setItem("accessToken", data.data.accessToken);
        await dispatch(fetchCurrentUser());
        toast.success("Email verified! Welcome to BIT Hostel Portal 🎉");
        navigate("/welcome", { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired OTP");
      setOtp(["", "", "", "", "", ""]);
      inputRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await api.post("/auth/resend-otp", { email });
      toast.success("New OTP sent to your email!");
      setResendTimer(RESEND_TIMEOUT);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs[0].current?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="bit-login-page">
      <motion.div
        className="bit-login-card"
        style={{ maxWidth: "420px" }}
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          style={{
            width: "68px",
            height: "68px",
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
            boxShadow: "0 6px 20px rgba(37,99,235,0.4)"
          }}
        >
          <ShieldCheck size={36} color="#ffffff" />
        </motion.div>

        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.3rem" }}>
          Verify Your Email
        </h2>
        <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.2rem" }}>
          We sent a 6-digit verification code to
        </p>
        <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#60a5fa", marginBottom: "1.2rem" }}>
          {email || "your email"}
        </p>

        {/* Dev OTP Chip (convenient testing) */}
        {devOtp && (
          <div
            onClick={() => { setOtp(devOtp.split("")); handleVerify(devOtp); }}
            style={{
              background: "rgba(34, 197, 94, 0.15)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "8px",
              padding: "0.4rem 0.8rem",
              color: "#4ade80",
              fontSize: "0.8rem",
              cursor: "pointer",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <Key size={14} />
            <span>Dev OTP: <strong>{devOtp}</strong> (Click to auto-verify)</span>
          </div>
        )}

        {/* OTP Input Boxes */}
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "1.2rem" }} onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              style={{
                width: "44px",
                height: "52px",
                textAlign: "center",
                fontSize: "1.3rem",
                fontWeight: 700,
                borderRadius: "10px",
                border: digit ? "2px solid #3b82f6" : "1px solid rgba(255,255,255,0.15)",
                background: digit ? "rgba(59, 130, 246, 0.15)" : "rgba(255, 255, 255, 0.05)",
                color: "#ffffff",
                outline: "none",
                transition: "all 0.2s"
              }}
              disabled={loading}
            />
          ))}
        </div>

        {/* Manual verify button */}
        <button
          onClick={() => handleVerify(otp.join(""))}
          disabled={loading || otp.some((d) => !d)}
          className="bit-google-btn"
          style={{ width: "100%", marginBottom: "0.8rem" }}
        >
          {loading ? <span className="bit-spinner" /> : "Verify Code"}
        </button>

        {/* Resend OTP */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", marginBottom: "1rem" }}>
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600 }}
            >
              <RotateCcw size={13} /> Resend Code
            </button>
          ) : (
            <span>Resend code in <strong style={{ color: "#ffffff" }}>{resendTimer}s</strong></span>
          )}
        </div>

        <Link
          to="/login"
          style={{
            fontSize: "0.8rem",
            color: "rgba(255,255,255,0.5)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem"
          }}
        >
          <ArrowLeft size={13} /> Back to Sign In
        </Link>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
