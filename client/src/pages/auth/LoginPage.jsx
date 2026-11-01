/**
 * @file LoginPage.jsx
 * @description BIT Information Portal login page with Google Sign-In style,
 * matching the dark-themed card UI with Omega logo, quick demo accounts,
 * and direct Sign Up / Register navigation.
 */

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, UserPlus, KeyRound, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

import { loginUser, selectAuthLoading, selectAuthError, clearError } from "../../redux/slices/authSlice";

// ─── BIT Logo SVG ────────────────────────────────────────────────────────────
const BITLogo = ({ size = 130 }) => (
  <svg viewBox="0 0 120 100" width={size} height={size * 0.85} aria-hidden="true"
    style={{ filter: "drop-shadow(0 4px 18px rgba(40,70,200,0.45))" }}>
    {/* Omega symbol */}
    <text x="50%" y="72" textAnchor="middle" fontSize="90" fill="#2a3580"
      fontFamily="Georgia, serif" opacity="0.95">Ω</text>
    {/* 3D Cube */}
    <g transform="translate(42, 28)">
      <polygon points="18,0 36,10 36,30 18,40 0,30 0,10" fill="#b8972a" stroke="#d4af3a" strokeWidth="1.5"/>
      <polygon points="18,0 36,10 18,20 0,10" fill="#d4af3a" stroke="#d4af3a" strokeWidth="1"/>
      <polygon points="0,10 18,20 18,40 0,30" fill="#a07820" stroke="#d4af3a" strokeWidth="1"/>
      <polygon points="36,10 18,20 18,40 36,30" fill="#c49a28" stroke="#d4af3a" strokeWidth="1"/>
      <text x="18" y="26" textAnchor="middle" fontSize="10" fill="white"
        fontWeight="bold" fontFamily="Arial, sans-serif">BIT</text>
    </g>
  </svg>
);

// ─── Google Icon SVG ──────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

const DEMO_USERS = [
  { role: "Student", email: "student1@bitsathy.ac.in", pass: "Student@2026", label: "Student" },
  { role: "Warden",  email: "warden.boysa@bitsathy.ac.in", pass: "Warden@2026", label: "Warden" },
  { role: "Admin",   email: "admin@bitsathy.ac.in", pass: "Admin@2026", label: "Admin" },
];

const LoginPage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [showForm, setShowForm] = useState(false);
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);

  const from = location.state?.from?.pathname || "/welcome";

  const handleGoogleSignIn = () => {
    setShowForm(true);
    toast("Sign in using your BIT credentials", { icon: "🔑" });
  };

  const handleFillDemo = (demo) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    setShowForm(true);
    toast.success(`Loaded ${demo.label} demo account!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    dispatch(clearError());
    const result = await dispatch(loginUser({ email, password }));

    if (loginUser.fulfilled.match(result)) {
      toast.success(`Welcome back, ${result.payload.user?.name?.split(" ")[0] || "User"}! 👋`);
      navigate(from, { replace: true });
    } else {
      toast.error(result.payload || "Login failed. Check your credentials.");
    }
  };

  return (
    <div className="bit-login-page">
      <motion.div
        className="bit-login-card"
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Welcome */}
        <p className="bit-welcome-text">Welcome Back!</p>

        {/* Logo area */}
        <div className="bit-logo-area">
          <div className="bit-omega-ring">
            <BITLogo size={130} />
          </div>
          <p className="bit-college-name">BANNARI AMMAN</p>
          <p className="bit-college-sub">INSTITUTE OF TECHNOLOGY</p>
          <p className="bit-college-tag">Stay Ahead</p>
        </div>

        {/* Divider */}
        <div className="bit-divider-line" />

        <p className="bit-portal-title">BIT Information Portal</p>

        {/* Quick Demo Pills — placed BEFORE sign-in options for easy access */}
        <div style={{
          width: "100%",
          marginBottom: "1rem",
          padding: "0.75rem 0.85rem",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
        }}>
          <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem", textAlign: "center" }}>
            ⚡ Quick Demo Login
          </p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            {DEMO_USERS.map((demo) => {
              const colorMap = { Student: "rgba(59,130,246,0.25)", Warden: "rgba(139,92,246,0.25)", Admin: "rgba(239,68,68,0.2)" };
              const borderMap = { Student: "rgba(59,130,246,0.4)", Warden: "rgba(139,92,246,0.4)", Admin: "rgba(239,68,68,0.35)" };
              const labelMap = { Student: "🎓 Student", Warden: "🏠 Warden", Admin: "⚙️ Admin" };
              return (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => handleFillDemo(demo)}
                  style={{
                    background: colorMap[demo.role],
                    border: `1px solid ${borderMap[demo.role]}`,
                    color: "#c8d8f5",
                    borderRadius: "8px",
                    padding: "0.3rem 0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    flex: 1,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.3)"}
                  onMouseLeave={(e) => e.currentTarget.style.filter = ""}
                >
                  {labelMap[demo.role]}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {authError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              className="bit-error-box"
            >
              ⚠️ {authError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sign In Options */}
        <AnimatePresence mode="wait">
          {!showForm ? (
            <motion.div
              key="login-choice"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{ width: "100%" }}
            >
              {/* Primary CTA — Email + Password */}
              <button
                id="bit-email-signin-btn"
                type="button"
                onClick={() => setShowForm(true)}
                className="bit-login-btn"
                style={{ background: "linear-gradient(135deg,#3b6de0,#4a82f5)", boxShadow: "0 4px 20px rgba(58,109,224,0.5)" }}
              >
                <KeyRound size={18} />
                <span>Sign in with Email & Password</span>
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "0.85rem 0" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>or</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
              </div>

              {/* Secondary — Google SSO */}
              <button
                id="bit-google-signin-btn"
                className="bit-google-btn"
                onClick={handleGoogleSignIn}
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "none" }}
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              <p className="bit-footer-text" style={{ marginTop: "0.85rem" }}>
                Sign in with your BIT institutional account
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="login-form"
              onSubmit={handleSubmit}
              className="bit-login-form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="bit-field">
                <label htmlFor="bit-email" className="bit-label">Email Address</label>
                <input
                  id="bit-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@bitsathy.ac.in"
                  className="bit-input"
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>

              <div className="bit-field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="bit-password" className="bit-label">Password</label>
                  <Link
                    to="/forgot-password"
                    style={{ fontSize: "0.75rem", color: "#60a5fa", textDecoration: "none" }}
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="bit-input-wrap">
                  <input
                    id="bit-password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="bit-input"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((p) => !p)}
                    className="bit-eye-btn"
                    aria-label="Toggle password visibility"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                id="bit-login-btn"
                type="submit"
                disabled={isLoading}
                className="bit-login-btn"
              >
                {isLoading ? <span className="bit-spinner" /> : "Sign In"}
              </button>

              <button
                type="button"
                onClick={() => { setShowForm(false); dispatch(clearError()); }}
                className="bit-back-link"
              >
                ← Back to sign-in options
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Sign Up / Create Account Prompt */}
        <div style={{
          marginTop: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.85rem",
          color: "rgba(255,255,255,0.6)",
        }}>
          <span>Don't have an account?</span>
          <Link
            to="/register"
            style={{
              color: "#38bdf8",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem"
            }}
          >
            <UserPlus size={15} />
            Sign Up
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
